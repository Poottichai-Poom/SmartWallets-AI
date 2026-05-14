import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as analysisService from '../services/analysis.service';
import * as aiService from '../services/ai.service';
import { db } from '../db/store';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function summary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) ?? currentMonth();
    const data = analysisService.getMonthlySummary(req.user!.id, month);
    res.json(data);
  } catch (err) { next(err); }
}

export function categories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) ?? currentMonth();
    const { categories } = analysisService.getMonthlySummary(req.user!.id, month);
    res.json({ categories });
  } catch (err) { next(err); }
}

export function daily(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) ?? currentMonth();
    const daily = analysisService.getDailySpending(req.user!.id, month);
    res.json({ month, daily });
  } catch (err) { next(err); }
}

export function leaks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) ?? currentMonth();
    const data = analysisService.getSpendingLeaks(req.user!.id, month);
    res.json({ leaks: data });
  } catch (err) { next(err); }
}

export async function recommendations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) ?? currentMonth();
    const { items: transactions } = db.findTransactionsByUser(req.user!.id, { month, limit: 9999 });
    const incomeSources = db.findIncomeSources(req.user!.id);
    const recs = await aiService.generateRecommendations(transactions, incomeSources);
    res.json({ recommendations: recs });
  } catch (err) { next(err); }
}
