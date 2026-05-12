import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';
  
  console.error(`[Error] ${status} - ${message}`);
  
  res.status(status).json({
    status,
    message,
  });
};
