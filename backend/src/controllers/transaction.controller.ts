import { Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { AuthRequest } from '../types';
import * as txnService from '../services/transaction.service';

export const createValidators = [
  body('date').isISO8601().withMessage('date must be ISO 8601'),
  body('merchant').trim().notEmpty(),
  body('amount').isFloat({ gt: 0 }).withMessage('amount must be positive'),
  body('catId').optional().isString(),
  body('note').optional().trim(),
];

export const updateValidators = [
  body('date').optional().isISO8601(),
  body('merchant').optional().trim().notEmpty(),
  body('amount').optional().isFloat({ gt: 0 }),
  body('catId').optional().isString(),
  body('note').optional().trim(),
];

export function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const month = req.query.month as string | undefined;
    const catId = req.query.catId as string | undefined;
    const page = parseInt(req.query.page as string ?? '1', 10);
    const limit = parseInt(req.query.limit as string ?? '50', 10);
    const result = txnService.getTransactions(req.user!.id, { month, catId, page, limit });
    res.json(result);
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const txn = txnService.createTransaction(req.user!.id, req.body);
    res.status(201).json(txn);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const txn = txnService.updateTransaction(req.params.id as string, req.user!.id, req.body);
    res.json(txn);
  } catch (err) { next(err); }
}

export function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    txnService.deleteTransaction(req.params.id as string, req.user!.id);
    res.json({ message: 'Transaction deleted' });
  } catch (err) { next(err); }
}
