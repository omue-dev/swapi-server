import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { isValidSortField } from '../utils/vaildation';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';
import { appendEanAssociations, enhanceProductsWithEan } from '../utils/productEanHelper';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

// Endpunkt für das Abrufen der Artikel
router.post('/', [authenticate], async (req: Request, res: Response) => {
  //console.log("/ endpoint called"); // Log-Ausgabe zum Überprüfen des Aufrufs
  const { page = 1, limit = 10, sortField = 'updatedAt', sortDirection = 'desc', manufacturerId } = req.body;

  if (!isValidSortField(sortField)) {
    return res.status(400).send(`Invalid sortField: ${sortField}`);
  }

  try {
    const filters = [
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
    ];

    if (manufacturerId) {
      filters.push({
        type: 'equals',
        field: 'manufacturerId',
        value: manufacturerId
      });
    }

    const requestBody = appendEanAssociations({
      "limit": Number(limit),
      "page": Number(page),
      "filter": filters,
      "sort": [
        {
          field: sortField,
          order: sortDirection
        }
      ],
      "total-count-mode": "exact"
    });

    //console.log("Request body sent to Shopware API:", JSON.stringify(requestBody, null, 2));

    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, requestBody, {
      headers: getHeaders(req)
    });

    //console.log("Shopware API response:", response.data);

    const { enhancedProducts } = enhanceProductsWithEan(response.data);
    const totalProducts = response.data.meta.total;

    res.status(200).json({success: true, log: "successfully fetched initial product data from endpoint /products", products: enhancedProducts, totalProducts });
  } catch (error) {
    console.error("Error in /products endpoint:", error);
    handleAxiosFetchError(error, res);
  }
});

export default router;
