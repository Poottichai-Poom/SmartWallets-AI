import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status: number = err.status ?? 500;
  const message: string = err.message ?? 'Something went wrong';

  if (status >= 500) logger.error(`[${status}] ${message}`, err);
  else logger.warn(`[${status}] ${message}`);

  res.status(status).json({ status, message });
};
