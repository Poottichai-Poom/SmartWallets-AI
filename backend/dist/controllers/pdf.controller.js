"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyValidators = exports.uploadValidators = void 0;
exports.uploadPDF = uploadPDF;
exports.verifyPassword = verifyPassword;
exports.getFile = getFile;
exports.listPDFs = listPDFs;
exports.deletePDF = deletePDF;
exports.analyzePDF = analyzePDF;
const express_validator_1 = require("express-validator");
const pdfService = __importStar(require("../services/pdf.service"));
const aiService = __importStar(require("../services/ai.service"));
const txnService = __importStar(require("../services/transaction.service"));
exports.uploadValidators = [
    (0, express_validator_1.body)('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('Month must be YYYY-MM format'),
];
exports.verifyValidators = [
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password required'),
];
async function uploadPDF(req, res, next) {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'PDF file required' });
            return;
        }
        const { month } = req.body;
        // If month is provided, find and delete old PDFs for the same month to replace data
        if (month) {
            const existing = pdfService.listUserPDFs(req.user.id);
            const toDelete = existing.filter(p => p.month === month);
            for (const old of toDelete) {
                console.log(`Replacing old PDF for month ${month}: ${old.id}`);
                pdfService.deletePDF(old.id, req.user.id, req);
            }
        }
        const { pdf, sessionToken, expiresAt } = await pdfService.storePDF(req.user.id, req.file.originalname, req.file.buffer, month);
        res.status(201).json({
            message: 'PDF uploaded and encrypted successfully',
            pdf: {
                id: pdf.id,
                originalName: pdf.originalName,
                status: pdf.status,
                month: pdf.month,
                createdAt: pdf.createdAt,
            },
            sessionToken,
            expiresAt,
        });
    }
    catch (err) {
        next(err);
    }
}
async function verifyPassword(req, res, next) {
    try {
        const id = req.params.id;
        const { password } = req.body;
        const session = await pdfService.verifyAndCreateSession(id, req.user.id, password, req);
        res.json({ message: 'Access granted', ...session });
    }
    catch (err) {
        next(err);
    }
}
function getFile(req, res, next) {
    try {
        const id = req.params.id;
        const sessionToken = req.headers['x-pdf-session'] ?? req.query.token;
        if (!sessionToken) {
            res.status(400).json({ message: 'Session token required' });
            return;
        }
        const { buffer, originalName } = pdfService.getDecryptedPDF(id, req.user.id, sessionToken, req);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${originalName}"`,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
        });
        res.send(buffer);
    }
    catch (err) {
        next(err);
    }
}
function listPDFs(req, res, next) {
    try {
        const pdfs = pdfService.listUserPDFs(req.user.id);
        res.json({ pdfs });
    }
    catch (err) {
        next(err);
    }
}
function deletePDF(req, res, next) {
    try {
        pdfService.deletePDF(req.params.id, req.user.id, req);
        res.json({ message: 'PDF deleted' });
    }
    catch (err) {
        next(err);
    }
}
async function analyzePDF(req, res, next) {
    try {
        const id = req.params.id;
        const sessionToken = req.headers['x-pdf-session'] ?? req.query.token;
        if (!sessionToken) {
            res.status(400).json({ message: 'Session token required for analysis' });
            return;
        }
        pdfService.updatePDFStatus(id, 'PROCESSING');
        const { buffer } = pdfService.getDecryptedPDF(id, req.user.id, sessionToken);
        const bankPassword = req.body?.bankPassword;
        console.log(`Analyzing PDF ${id}, bankPassword provided: ${!!bankPassword}`);
        const extracted = await aiService.extractTransactionsFromPDF(buffer, bankPassword);
        const transactions = txnService.importExtractedTransactions(req.user.id, id, extracted);
        pdfService.updatePDFStatus(id, 'COMPLETED');
        res.json({
            message: 'Analysis complete',
            transactionsImported: transactions.length,
            transactions,
        });
    }
    catch (err) {
        pdfService.updatePDFStatus(req.params.id, 'FAILED');
        next(err);
    }
}
