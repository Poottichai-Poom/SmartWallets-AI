"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFileKey = generateFileKey;
exports.encryptBuffer = encryptBuffer;
exports.decryptBuffer = decryptBuffer;
exports.encryptKeyWithMaster = encryptKeyWithMaster;
exports.decryptKeyWithMaster = decryptKeyWithMaster;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
function generateFileKey() {
    return crypto_1.default.randomBytes(KEY_LENGTH);
}
function encryptBuffer(data, key) {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { encrypted, iv: iv.toString('hex'), authTag: authTag.toString('hex') };
}
function decryptBuffer(encrypted, key, iv, authTag) {
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
function encryptKeyWithMaster(fileKey) {
    const masterKey = Buffer.from(process.env.ENCRYPTION_MASTER_KEY, 'hex');
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(fileKey), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
        enc: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        tag: authTag.toString('hex'),
    });
}
function decryptKeyWithMaster(encryptedKeyJson) {
    const masterKey = Buffer.from(process.env.ENCRYPTION_MASTER_KEY, 'hex');
    const { enc, iv, tag } = JSON.parse(encryptedKeyJson);
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, masterKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(enc, 'hex')), decipher.final()]);
}
