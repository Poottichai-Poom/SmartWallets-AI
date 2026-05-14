"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storePDF = storePDF;
exports.verifyAndCreateSession = verifyAndCreateSession;
exports.getDecryptedPDF = getDecryptedPDF;
exports.getPDFBuffer = getPDFBuffer;
exports.listUserPDFs = listUserPDFs;
exports.deletePDF = deletePDF;
exports.updatePDFStatus = updatePDFStatus;
exports.cleanExpiredSessions = cleanExpiredSessions;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const store_1 = require("../db/store");
const encryption_service_1 = require("./encryption.service");
const audit_service_1 = require("./audit.service");
const UPLOAD_DIR = path_1.default.resolve(process.env.UPLOAD_DIR ?? './uploads');
const SESSION_MINUTES = parseInt(process.env.PDF_ACCESS_SESSION_MINUTES ?? '30', 10);
const SALT_ROUNDS = 12;
async function storePDF(userId, originalName, fileBuffer, accessPassword, month) {
    if (!fs_1.default.existsSync(UPLOAD_DIR))
        fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
    const fileKey = (0, encryption_service_1.generateFileKey)();
    const { encrypted, iv, authTag } = (0, encryption_service_1.encryptBuffer)(fileBuffer, fileKey);
    const encryptedKey = (0, encryption_service_1.encryptKeyWithMaster)(fileKey);
    const fileName = `${(0, uuid_1.v4)()}.enc`;
    const encryptedPath = path_1.default.join(UPLOAD_DIR, fileName);
    fs_1.default.writeFileSync(encryptedPath, encrypted);
    const passwordHash = await bcryptjs_1.default.hash(accessPassword, SALT_ROUNDS);
    return store_1.db.createPDF({
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
}
async function verifyAndCreateSession(pdfId, userId, password, req) {
    const pdf = store_1.db.findPDFById(pdfId);
    if (!pdf || pdf.userId !== userId) {
        throw Object.assign(new Error('PDF not found'), { status: 404 });
    }
    const valid = await bcryptjs_1.default.compare(password, pdf.passwordHash);
    if (!valid) {
        (0, audit_service_1.logAction)('PDF_ACCESS_DENIED', `pdf:${pdfId}`, { userId, req });
        throw Object.assign(new Error('Incorrect password'), { status: 403 });
    }
    store_1.db.deletePDFSessions(pdfId);
    const token = (0, uuid_1.v4)();
    const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60 * 1000).toISOString();
    const session = store_1.db.createPDFSession(pdfId, token, expiresAt);
    (0, audit_service_1.logAction)('PDF_ACCESS_GRANTED', `pdf:${pdfId}`, { userId, req });
    return { sessionToken: session.token, expiresAt };
}
function getDecryptedPDF(pdfId, userId, sessionToken, req) {
    const session = store_1.db.findPDFSession(sessionToken);
    if (!session || session.pdfId !== pdfId) {
        throw Object.assign(new Error('Invalid or expired session'), { status: 403 });
    }
    if (new Date(session.expiresAt) < new Date()) {
        store_1.db.deletePDFSessions(pdfId);
        throw Object.assign(new Error('Session expired'), { status: 403 });
    }
    const pdf = store_1.db.findPDFById(pdfId);
    if (!pdf || pdf.userId !== userId) {
        throw Object.assign(new Error('Access denied'), { status: 403 });
    }
    const fileKey = (0, encryption_service_1.decryptKeyWithMaster)(pdf.encryptedKey);
    const encryptedData = fs_1.default.readFileSync(pdf.encryptedPath);
    const buffer = (0, encryption_service_1.decryptBuffer)(encryptedData, fileKey, pdf.iv, pdf.authTag);
    (0, audit_service_1.logAction)('PDF_DOWNLOADED', `pdf:${pdfId}`, { userId, req });
    return { buffer, originalName: pdf.originalName };
}
function getPDFBuffer(pdfId, userId) {
    const pdf = store_1.db.findPDFById(pdfId);
    if (!pdf || pdf.userId !== userId) {
        throw Object.assign(new Error('PDF not found'), { status: 404 });
    }
    const fileKey = (0, encryption_service_1.decryptKeyWithMaster)(pdf.encryptedKey);
    const encryptedData = fs_1.default.readFileSync(pdf.encryptedPath);
    return (0, encryption_service_1.decryptBuffer)(encryptedData, fileKey, pdf.iv, pdf.authTag);
}
function listUserPDFs(userId) {
    return store_1.db.findPDFsByUser(userId).map(({ encryptedPath, encryptedKey, iv, authTag, passwordHash, ...safe }) => safe);
}
function deletePDF(pdfId, userId, req) {
    const pdf = store_1.db.findPDFById(pdfId);
    if (!pdf || pdf.userId !== userId) {
        throw Object.assign(new Error('PDF not found'), { status: 404 });
    }
    if (fs_1.default.existsSync(pdf.encryptedPath))
        fs_1.default.unlinkSync(pdf.encryptedPath);
    // Delete associated transactions
    store_1.db.deleteTransactionsByPdf(pdfId, userId);
    store_1.db.deletePDF(pdfId);
    (0, audit_service_1.logAction)('PDF_DELETED', `pdf:${pdfId}`, { userId, req });
}
function updatePDFStatus(pdfId, status) {
    store_1.db.updatePDFStatus(pdfId, status);
}
function cleanExpiredSessions() {
    store_1.db.deleteExpiredPDFSessions();
}
