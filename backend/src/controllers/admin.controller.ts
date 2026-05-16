import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { db } from '../db/store';
import { getAuditLogs } from '../services/audit.service';

export function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = db.listUsers();
    res.json({ users, total: users.length });
  } catch (err) { next(err); }
}

export function auditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string ?? '1', 10);
    const limit = parseInt(req.query.limit as string ?? '50', 10);
    res.json(getAuditLogs(page, limit));
  } catch (err) { next(err); }
}
