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
      filter: [
      {
        type: 'contains',
        field: 'name',
        value: productName.split(',')[0]
      },
      {
        type: 'equals',
        field: 'parentId',
        value: null
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
    //console.log('Full response:', req.headers);

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
      shortText: item.attributes.customFields.custom_add_product_attributes_short_text
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

//Endpunkt zum Aktualisieren von Produkten
router.post('/update-products', [authenticate, checkCache], async (req: Request, res: Response) => {
  const formData = req.body;
  console.log('Received formData:', formData);

  const id = formData.id;

  // Ensure the authorization header is correctly extracted from the request headers
  const authorizationHeader = req.headers['Authorization']!;
  if (!authorizationHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header is missing'
    });
  }

  // Prepare the payload with the correct structure
  const payload = {
    id: formData.id,
    description: formData.description,
    metaDescription: formData.metaDescription,
    metaTitle: formData.metaTitle,
    keywords: formData.keywords,
    categories: formData.categoryIds.map((id: string) => ({ id })),
    customFields: formData.customFields
  };

  const options = {
    method: 'PATCH',
    url: `${SHOPWARE_API_URL}/product/${id}`,
    headers: {
      'Accept': 'application/vnd.api+json, application/json',
      'Content-Type': 'application/json',
      'Authorization': authorizationHeader
    },
    data: payload
  };

  try {
    const { data } = await axios.request({
      ...options,
      method: 'PATCH',
    });
    console.log('Product update response:', data);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error during product update:', error);

    // Extract detailed error information
    if (axios.isAxiosError(error)) {
      const errorResponse = error.response;
      res.status(errorResponse?.status || 500).json({
        success: false,
        message: error.message,
        error: errorResponse?.data || 'Unknown error occurred'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }
});

// Endpoint to fetch categories with products that are active
router.post('/categories', [authenticate, checkCache], async (req: Request, res: Response) => {
  const options = {
    method: 'GET',
    url: `${SHOPWARE_API_URL}/category`,
    headers: {
      'Accept': 'application/vnd.api+json, application/json',
      'Authorization': req.headers['Authorization']!,
    },
    data: {
      "filter": [
        {
          "type": "multi",
          "operator": "AND",
          "queries": [
            {
              "type": "range",
              "field": "productCount",
              "parameters": {
                "gt": 0
              }
            },
            {
              "type": "equals",
              "field": "active",
              "value": true
            }
          ]
        }
      ],
      "sort": [
        {
          "field": "name",
          "order": "ASC"
        }
      ]
    }
  };

  try {
    const response = await axios.request({
      ...options,
      method: 'GET',
    });
    const categories = response.data.data.map((category: any) => ({
      id: category.id,
      name: category.attributes.name
    }));
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error });
  }
});


export default router;
