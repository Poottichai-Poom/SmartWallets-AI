import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../types';
import { db } from '../db/store';

export const createValidators = [
  body('nameEn').trim().notEmpty(),
  body('nameTh').optional().trim(),
  body('target').isFloat({ gt: 0 }),
  body('saved').optional().isFloat({ min: 0 }),
  body('byMonths').isInt({ min: 1 }),
  body('priority').isIn(['low', 'medium', 'high']),
];

export const updateValidators = [
  body('nameEn').optional().trim().notEmpty(),
  body('target').optional().isFloat({ gt: 0 }),
  body('saved').optional().isFloat({ min: 0 }),
  body('byMonths').optional().isInt({ min: 1 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
];

export function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ goals: db.findGoals(req.user!.id) });
  } catch (err) { next(err); }
}

export function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const goal = db.createGoal({ ...req.body, userId: req.user!.id, saved: req.body.saved ?? 0 });
    res.status(201).json(goal);
  } catch (err) { next(err); }
}

export function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const goal = db.updateGoal(req.params.id as string, req.user!.id, req.body);
    if (!goal) { res.status(404).json({ message: 'Goal not found' }); return; }
    res.json(goal);
  } catch (err) { next(err); }
}

export function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const deleted = db.deleteGoal(req.params.id as string, req.user!.id);
    if (!deleted) { res.status(404).json({ message: 'Goal not found' }); return; }
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}
