import { Request, Response, NextFunction } from 'express';

// Remove Redis-related functions, replacing checkCache with a passthrough middleware
export const checkCache = async (req: Request, res: Response, next: NextFunction) => {
  next();
};
