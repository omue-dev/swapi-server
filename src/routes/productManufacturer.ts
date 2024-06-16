import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

router.post('/', authenticate, async (req: Request, res: Response) => {
  console.log("/product-manufacturers"); // Log-Ausgabe zum Überprüfen des Aufrufs
  try {
    const requestBody = {
      limit: 5000,
      filter: [
        {
          type: 'not',
          field: 'products.id',
          value: null
        },
        {
          type: 'not',
          field: 'media.id',
          value: null
        }
      ]
    };

    const response = await axios.post(`${SHOPWARE_API_URL}/search/product-manufacturer`, requestBody, {
      headers: getHeaders(req)
    });

    const manufacturersWithMedia = response.data.data.filter((item: any) => item.attributes.mediaId);

    res.json({ data: manufacturersWithMedia });
  } catch (error) {
    handleAxiosFetchError(error, res);
  }
});

export default router;