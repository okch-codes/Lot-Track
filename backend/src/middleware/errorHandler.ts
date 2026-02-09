import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Internal server error' });
}
