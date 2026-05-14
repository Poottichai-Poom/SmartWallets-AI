import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

export function generateFileKey(): Buffer {
  return crypto.randomBytes(KEY_LENGTH);
}

export function encryptBuffer(
  data: Buffer,
  key: Buffer
): { encrypted: Buffer; iv: string; authTag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted, iv: iv.toString('hex'), authTag: authTag.toString('hex') };
}

export function decryptBuffer(
  encrypted: Buffer,
  key: Buffer,
  iv: string,
  authTag: string
): Buffer {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function encryptKeyWithMaster(fileKey: Buffer): string {
  const masterKey = Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(fileKey), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return JSON.stringify({
    enc: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: authTag.toString('hex'),
  });
}

export function decryptKeyWithMaster(encryptedKeyJson: string): Buffer {
  const masterKey = Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex');
  const { enc, iv, tag } = JSON.parse(encryptedKeyJson);
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(enc, 'hex')), decipher.final()]);
}
