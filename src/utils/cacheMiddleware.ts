import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

export const redisClient = createClient({
    url: 'redis://127.0.0.1:6379'
  });
  
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  
  (async () => {
    await redisClient.connect();
  })();

export const checkCache = async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 20, sortField = 'updatedAt', sortDirection = 'desc' } = req.body;
  const cacheKey = `products:${page}:${limit}:${sortField}:${sortDirection}`;

  try {
    const data = await redisClient.get(cacheKey);
    if (data) {
      res.send(JSON.parse(data));
    } else {
      next();
    }
  } catch (err) {
    console.error('Redis GET Error:', err);
    next();
  }
};


  