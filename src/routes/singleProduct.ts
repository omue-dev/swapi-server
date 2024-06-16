import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { checkCache, redisClient } from '../utils/cacheMiddleware'; 
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL

// Endpunkt für das Abrufen eines einzelnen Produkts
router.get('/', authenticate, checkCache, async (req: Request, res: Response) => {
  console.log("/single-product/"); // Log-Ausgabe zum Überprüfen des Aufrufs
  const { id } = req.params;

  try {
    const response = await axios.get(`${SHOPWARE_API_URL}/product/${id}`, {
      headers: getHeaders(req)
    });

    const product = response.data;

    // Cache speichern
    await redisClient.set(`product:${id}`, JSON.stringify(product));

    res.status(200).json({sucess: true, log: "successfully fetched product data from endpoint /products/:id", product });
  } catch (error) {
    handleAxiosFetchError(error, res);
  }
});

export default router;
