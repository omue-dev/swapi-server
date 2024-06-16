import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { checkCache } from '../utils/cacheMiddleware'; 
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

// Endpoint to fetch categories with products that are active
router.post('/', [authenticate, checkCache], async (req: Request, res: Response) => {
  console.log("/categories-with-products"); // Log-Ausgabe zum Überprüfen des Aufrufs
    const options = {
      method: 'GET',
      url: `${SHOPWARE_API_URL}/category`,
      headers: getHeaders(req),
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
      res.status(200).json({ success: true, log: "successfully fetched categories from api endpoint categories", categories });
    } catch (error) {
        handleAxiosFetchError(error, res);
    }
  });

  export default router;