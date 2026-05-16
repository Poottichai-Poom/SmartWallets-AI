import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { db } from '../db/store';
import { generateFileKey, encryptBuffer, decryptBuffer, encryptKeyWithMaster, decryptKeyWithMaster } from './encryption.service';
import { logAction } from './audit.service';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
const SESSION_MINUTES = parseInt(process.env.PDF_ACCESS_SESSION_MINUTES ?? '30', 10);
const SALT_ROUNDS = 12;

export async function storePDF(
  userId: string,
  originalName: string,
  fileBuffer: Buffer,
  month?: string
) {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const fileKey = generateFileKey();
  const { encrypted, iv, authTag } = encryptBuffer(fileBuffer, fileKey);
  const encryptedKey = encryptKeyWithMaster(fileKey);

  const fileName = `${uuidv4()}.enc`;
  const encryptedPath = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(encryptedPath, encrypted);

  const passwordHash = await bcrypt.hash(uuidv4(), SALT_ROUNDS);

  const pdf = db.createPDF({
    userId,
    originalName,
    encryptedPath,
    encryptedKey,
    iv,
    authTag,
    passwordHash,
    status: 'PENDING',
    month,
  });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60 * 1000).toISOString();
  const session = db.createPDFSession(pdf.id, token, expiresAt);

  return { pdf, sessionToken: session.token, expiresAt };
}

export async function verifyAndCreateSession(
  pdfId: string,
  userId: string,
  password: string,
  req?: Request
) {
  const pdf = db.findPDFById(pdfId);
  if (!pdf || pdf.userId !== userId) {
    throw Object.assign(new Error('PDF not found'), { status: 404 });
  }

  const valid = await bcrypt.compare(password, pdf.passwordHash);
  if (!valid) {
    logAction('PDF_ACCESS_DENIED', `pdf:${pdfId}`, { userId, req });
    throw Object.assign(new Error('Incorrect password'), { status: 403 });
  }

  db.deletePDFSessions(pdfId);
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60 * 1000).toISOString();
  const session = db.createPDFSession(pdfId, token, expiresAt);

  logAction('PDF_ACCESS_GRANTED', `pdf:${pdfId}`, { userId, req });
  return { sessionToken: session.token, expiresAt };
}

export function getDecryptedPDF(
  pdfId: string,
  userId: string,
  sessionToken: string,
  req?: Request
): { buffer: Buffer; originalName: string } {
  const session = db.findPDFSession(sessionToken);

  if (!session || session.pdfId !== pdfId) {
    throw Object.assign(new Error('Invalid or expired session'), { status: 403 });
  }
  if (new Date(session.expiresAt) < new Date()) {
    db.deletePDFSessions(pdfId);
    throw Object.assign(new Error('Session expired'), { status: 403 });
  }

  const pdf = db.findPDFById(pdfId);
  if (!pdf || pdf.userId !== userId) {
    throw Object.assign(new Error('Access denied'), { status: 403 });
  }

  const fileKey = decryptKeyWithMaster(pdf.encryptedKey);
  const encryptedData = fs.readFileSync(pdf.encryptedPath);
  const buffer = decryptBuffer(encryptedData, fileKey, pdf.iv, pdf.authTag);

  logAction('PDF_DOWNLOADED', `pdf:${pdfId}`, { userId, req });
  return { buffer, originalName: pdf.originalName };
}

export function getPDFBuffer(pdfId: string, userId: string): Buffer {
  const pdf = db.findPDFById(pdfId);
  if (!pdf || pdf.userId !== userId) {
    throw Object.assign(new Error('PDF not found'), { status: 404 });
  }
  const fileKey = decryptKeyWithMaster(pdf.encryptedKey);
  const encryptedData = fs.readFileSync(pdf.encryptedPath);
  return decryptBuffer(encryptedData, fileKey, pdf.iv, pdf.authTag);
}

export function listUserPDFs(userId: string) {
  return db.findPDFsByUser(userId).map(({ encryptedPath, encryptedKey, iv, authTag, passwordHash, ...safe }) => safe);
}

export function deletePDF(pdfId: string, userId: string, req?: Request) {
  const pdf = db.findPDFById(pdfId);
  if (!pdf || pdf.userId !== userId) {
    throw Object.assign(new Error('PDF not found'), { status: 404 });
  }
  if (fs.existsSync(pdf.encryptedPath)) fs.unlinkSync(pdf.encryptedPath);
  
  // Delete associated transactions
  db.deleteTransactionsByPdf(pdfId, userId);
  
  db.deletePDF(pdfId);
  logAction('PDF_DELETED', `pdf:${pdfId}`, { userId, req });
}

export function updatePDFStatus(pdfId: string, status: 'PROCESSING' | 'COMPLETED' | 'FAILED') {
  db.updatePDFStatus(pdfId, status);
}

export function cleanExpiredSessions() {
  db.deleteExpiredPDFSessions();
}
