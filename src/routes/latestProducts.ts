import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { checkCache, redisClient } from '../utils/cacheMiddleware'; 
import { isValidSortField } from '../utils/vaildation';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

// Endpunkt für das Abrufen der Artikel
router.post('/', [authenticate, checkCache], async (req: Request, res: Response) => {
  console.log("/products"); // Log-Ausgabe zum Überprüfen des Aufrufs
  const { page = 1, limit = 10, sortField = 'updatedAt', sortDirection = 'desc' } = req.body;
  const cacheKey = `products:${page}:${limit}:${sortField}:${sortDirection}`;

  if (!isValidSortField(sortField)) {
    return res.status(400).send(`Invalid sortField: ${sortField}`);
  }

  try {
    const requestBody = {
      "limit": Number(limit),
      "page": Number(page),
      "filter": [
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
        }
      ],
      "sort": [
        {
          field: sortField,
          order: sortDirection
        }
      ],
      "total-count-mode": "exact"
    };

    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, requestBody, {
      headers: getHeaders(req)
    });

    const products = response.data.data;
    const totalProducts = response.data.meta.total;

    // Cache speichern
    await redisClient.set(cacheKey, JSON.stringify({ products, totalProducts }));

    res.status(200).json({sucess: true, log: "successfully fetched initial product data from endpoint /products", products, totalProducts });
  } catch (error) {
    handleAxiosFetchError(error, res);
  }
});

export default router;
