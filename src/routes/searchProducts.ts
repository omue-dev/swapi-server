import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';

const router = Router();
const SHOPWARE_API_URL = 'https://www.weltenbummler-erkelenz.de/api';

// Endpunkt für das Abrufen der Artikel
router.post('/search/product', authenticate, async (req: Request, res: Response) => {
  // console.log("/search/product/"); // Log-Ausgabe zum Überprüfen des Aufrufs
  const { searchTerm, page = 1, limit = 10, sortField = 'name', sortDirection = 'asc' } = req.body;
  // console.log(searchTerm); // Log-Ausgabe zum Überprüfen des Aufrufs

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
          "type": "contains",
          "field": "name",
          "value": searchTerm,
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

    // console.log("Request Body:", requestBody);

    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, requestBody, {
      headers: {
        'Accept': 'application/vnd.api+json, application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers['Authorization']!
      }
    });

    // console.log("Response Data:", response.data);

    const products = response.data.data;
    const totalProducts = response.data.meta.total;

    res.status(200).json({ success: true, log: "successfully fetched search-terms from api endpoint search-products", products, totalProducts });

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

export default router;
