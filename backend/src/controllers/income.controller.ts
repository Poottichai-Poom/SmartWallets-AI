import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../types';
import { db } from '../db/store';

export const createValidators = [
  body('nameEn').trim().notEmpty(),
  body('nameTh').optional().trim(),
  body('amount').isFloat({ gt: 0 }),
  body('type').isIn(['salary', 'side', 'investment', 'bonus', 'other']),
  body('dayOfMonth').isInt({ min: 1, max: 31 }),
];

export const updateValidators = [
  body('nameEn').optional().trim().notEmpty(),
  body('amount').optional().isFloat({ gt: 0 }),
  body('type').optional().isIn(['salary', 'side', 'investment', 'bonus', 'other']),
  body('dayOfMonth').optional().isInt({ min: 1, max: 31 }),
];

export function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ incomeSources: db.findIncomeSources(req.user!.id) });
  } catch (err) { next(err); }
}

export function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const src = db.createIncomeSource({ ...req.body, userId: req.user!.id });
    res.status(201).json(src);
  } catch (err) { next(err); }
}

export function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const src = db.updateIncomeSource(req.params.id as string, req.user!.id, req.body);
    if (!src) { res.status(404).json({ message: 'Income source not found' }); return; }
    res.json(src);
  } catch (err) { next(err); }
}

export function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const deleted = db.deleteIncomeSource(req.params.id as string, req.user!.id);
    if (!deleted) { res.status(404).json({ message: 'Income source not found' }); return; }
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}
