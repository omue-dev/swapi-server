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

// Endpunkt für das Abrufen der Artikel
router.post('/products', [authenticate, checkCache], async (req: Request, res: Response) => {
  const { page = 1, limit = 10, sortField = 'updatedAt', sortDirection = 'desc' } = req.body;
  const cacheKey = `products:${page}:${limit}:${sortField}:${sortDirection}`;

  // Überprüfen, ob sortField ein gültiges Feld ist
  const validSortFields = ['updatedAt', 'name', 'stock', 'productNumber'];
  if (!validSortFields.includes(sortField)) {
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
      "headers": {
        'Accept': 'application/vnd.api+json, application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers['Authorization']!
      }
    });

    const products = response.data.data;
    const totalProducts = response.data.meta.total;

    // Cache speichern
    await redisClient.set(cacheKey, JSON.stringify({ products, totalProducts }));

    res.json({ products, totalProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error response:', error.response?.data);
      res.status(500).send(error.response?.data || error.message);
    } else {
      res.status(500).send('An unknown error occurred');
    }
  }
});

// Endpunkt für das Abrufen eines einzelnen Produkts
router.get('/products/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${SHOPWARE_API_URL}/product/${id}`, {
      "headers": {
        'Accept': 'application/vnd.api+json, application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers['Authorization']!
      }
    });

    const product = response.data;

    // Cache speichern
    await redisClient.set(`product:${id}`, JSON.stringify(product));

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error response:', error.response?.data);
      res.status(500).send(error.response?.data || error.message);
    } else {
      res.status(500).send('An unknown error occurred');
    }
  }
});

// Endpunkt für das Abrufen verwandter Produkte
router.post('/relatedproducts', [authenticate, checkCache], async (req: Request, res: Response) => {
  const { productName } = req.body;

  if (!productName) {
    return res.status(400).send('Product name is required');
  }

  try {
    const requestBody = {
      "filter": [
        {
          type: 'or',
          operator: 'or',
          queries: [
            {
              type: 'contains',
              field: 'name',
              value: productName
            },
            {
              type: 'contains',
              field: 'name',
              value: productName.split(',')[0]
            }
          ]
        }
      ]
    };

    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, requestBody, {
      "headers": {
        'Accept': 'application/vnd.api+json, application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers['Authorization']!
      }
    });
    //console.log('Full response:', response.data.data);

    const relatedProducts = response.data.data.map((item: any) => ({
      id: item.id,
      name: item.attributes.name,
      productNumber: item.attributes.productNumber,
      active: item.attributes.active,
      description: item.attributes.description,
      customSearchKeywords: item.attributes.customSearchKeywords,
      ean: item.attributes.ean,
      metaDescription: item.attributes.metaDescription,
      metaTitle: item.attributes.metaTitle,
      keywords: item.attributes.keywords,
      categoryIds: item.attributes.categoryIds,
      shortText: item.attributes.shortText
    }));

    //console.log(relatedProducts);
    res.json({ relatedProducts });
  } catch (error) {
    console.error('Error fetching related products:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error response:', error.response?.data);
      return res.status(500).send(error.response?.data || error.message);
    } else {
      return res.status(500).send('An unknown error occurred');
    }
  }
});

export default router;
