import { Request } from 'express';
import { db } from '../db/store';
import { logger } from '../utils/logger';

export function logAction(
  action: string,
  resource: string,
  options: { userId?: string; details?: string; req?: Request } = {}
): void {
  try {
    db.createAuditLog({
      action,
      resource,
      userId: options.userId,
      details: options.details,
      ip: options.req?.ip,
      userAgent: options.req?.headers['user-agent'],
    });
  } catch (err) {
    logger.error('Failed to write audit log', { err });
  }
}

export function getAuditLogs(page = 1, limit = 50) {
  return db.findAuditLogs(page, limit);
}
