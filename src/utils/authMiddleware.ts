import { Request, Response, NextFunction } from 'express';

const API_KEY = process.env.API_KEY;

export const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  if (!API_KEY) {
    console.error('API_KEY environment variable is not configured');
    res.status(500).json({
      success: false,
      message: 'Server configuration error',
    });
    return;
  }

  const providedKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!providedKey) {
    res.status(401).json({
      success: false,
      message: 'API key is required. Provide via X-API-Key header or Authorization: Bearer <key>',
    });
    return;
  }

  if (providedKey !== API_KEY) {
    res.status(403).json({
      success: false,
      message: 'Invalid API key',
    });
    return;
  }

  next();
};
