import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { isValidSortField } from '../utils/vaildation';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

// Endpunkt für das Abrufen der Artikel
router.post('/', authenticate, async (req: Request, res: Response) => {
  //console.log("/search-products/"); // Log-Ausgabe zum Überprüfen des Aufrufs
  const { searchTerm, page = 1, limit = 10, sortField = 'name', sortDirection = 'asc' } = req.body;

  if (!isValidSortField(sortField)) {
    return res.status(400).send(`Invalid sortField: ${sortField}`);
  }

  try {
    const requestBody = {
      "limit": Number(limit),
      "page": Number(page),
      "filter": [
        {
          "type": "contains",
          "field": "name",
          "value": searchTerm,
        },
        {
          "type": "equals",
          "field": "parentId",
          "value": null // Nur Hauptprodukte, keine Varianten
        }
      ],
      "sort": [
        {
          "field": sortField,
          "order": sortDirection
        }
      ],
      "total-count-mode": "exact",
    };

    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, requestBody, {
      headers: getHeaders(req)
    });

    const products = response.data.data;
    const totalProducts = response.data.meta.total;

    res.status(200).json({ success: true, log: "successfully fetched search-terms from api endpoint search-products", products, totalProducts });

  } catch (error) {
    handleAxiosFetchError(error, res);
  }
});

export default router;
