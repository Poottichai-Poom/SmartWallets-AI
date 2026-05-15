import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../types';
import * as pdfService from '../services/pdf.service';
import * as aiService from '../services/ai.service';
import * as txnService from '../services/transaction.service';

export const uploadValidators = [
  body('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('Month must be YYYY-MM format'),
];

export const verifyValidators = [
  body('password').notEmpty().withMessage('Password required'),
];

export async function uploadPDF(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ message: 'PDF file required' }); return; }
    const { month } = req.body;

    // If month is provided, find and delete old PDFs for the same month to replace data
    if (month) {
      const existing = pdfService.listUserPDFs(req.user!.id);
      const toDelete = existing.filter(p => p.month === month);
      for (const old of toDelete) {
        console.log(`Replacing old PDF for month ${month}: ${old.id}`);
        pdfService.deletePDF(old.id, req.user!.id, req);
      }
    }

    const { pdf, sessionToken, expiresAt } = await pdfService.storePDF(
      req.user!.id,
      req.file.originalname,
      req.file.buffer,
      month
    );
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
  } catch (err) { next(err); }
}

export async function verifyPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { password } = req.body;
    const session = await pdfService.verifyAndCreateSession(id, req.user!.id, password, req);
    res.json({ message: 'Access granted', ...session });
  } catch (err) { next(err); }
}

export function getFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const sessionToken = (req.headers['x-pdf-session'] as string) ?? req.query.token as string;
    if (!sessionToken) { res.status(400).json({ message: 'Session token required' }); return; }
    const { buffer, originalName } = pdfService.getDecryptedPDF(id, req.user!.id, sessionToken, req);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${originalName}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(buffer);
  } catch (err) { next(err); }
}

export function listPDFs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pdfs = pdfService.listUserPDFs(req.user!.id);
    res.json({ pdfs });
  } catch (err) { next(err); }
}

export function deletePDF(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    pdfService.deletePDF(req.params.id as string, req.user!.id, req);
    res.json({ message: 'PDF deleted' });
  } catch (err) { next(err); }
}

export async function analyzePDF(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const sessionToken = (req.headers['x-pdf-session'] as string) ?? req.query.token as string;
    if (!sessionToken) { res.status(400).json({ message: 'Session token required for analysis' }); return; }

    pdfService.updatePDFStatus(id, 'PROCESSING');
    const { buffer } = pdfService.getDecryptedPDF(id, req.user!.id, sessionToken);
    const bankPassword = req.body?.bankPassword as string | undefined;
    console.log(`Analyzing PDF ${id}, bankPassword provided: ${!!bankPassword}`);
    const extracted = await aiService.extractTransactionsFromPDF(buffer, bankPassword);

    const transactions = txnService.importExtractedTransactions(req.user!.id, id, extracted);
    pdfService.updatePDFStatus(id, 'COMPLETED');

    res.json({
      message: 'Analysis complete',
      transactionsImported: transactions.length,
      transactions,
    });
  } catch (err) {
    pdfService.updatePDFStatus(req.params.id as string, 'FAILED');
    next(err);
  }
}
