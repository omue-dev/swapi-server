import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { createClient } from 'redis';

const router = Router();
const SHOPWARE_API_URL = 'https://www.weltenbummler-erkelenz.de/api';
const redisClient = createClient({
  url: 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

// Middleware zur Überprüfung des Caches
const checkCache = async (req: Request, res: Response, next: () => void) => {
  const { page = 1, limit = 20 } = req.query;
  const cacheKey = `products:${page}:${limit}`;

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

// Endpunkt für das Abrufen der Artikel
router.post('/search/product', [authenticate, checkCache], async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const cacheKey = `products:${page}:${limit}`;

  try {
    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, {
      limit: Number(limit),
      page: Number(page),
      filter: [
        {
          type: 'range',
          field: 'stock',
          parameters: {
            gte: 1
          }
        },
        {
          type: 'equals',
          field: 'active',
          value: false
        },
        {
          type: 'equals',
          field: 'description',
          value: null
        }
      ],
      sort: [
        {
          field: 'updatedAt',
          order: 'desc'
        }
      ]
    }, {
      headers: {
        'Accept': 'application/vnd.api+json, application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers['Authorization']!
      }
    });

    const data = response.data;
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(data)); // Cache für 1 Stunde

    res.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    if (axios.isAxiosError(error)) {
      res.status(500).send(error.response?.data || error.message);
    } else {
      res.status(500).send('An unknown error occurred');
    }
  }
});

// Endpunkt für das Abrufen von Artikeln nach Name
router.post('/search/product-by-name', authenticate, async (req: Request, res: Response) => {
  const { name } = req.body;

  try {
    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, {
      filter: [
        {
          type: 'equals',
          field: 'name',
          value: name
        }
      ]
    }, {
      headers: {
        'Accept': 'application/vnd.api+json, application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers['Authorization']!
      }
    });

    res.json(response.data.data);
  } catch (error) {
    console.error('Error fetching products by name:', error);
    if (axios.isAxiosError(error)) {
      res.status(500).send(error.response?.data || error.message);
    } else {
      res.status(500).send('An unknown error occurred');
    }
  }
});

export default router;
