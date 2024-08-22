// single-product.ts
import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate'; 
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

// Endpunkt für das Abrufen eines einzelnen Produkts
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${SHOPWARE_API_URL}/product/${id}`, {
      headers: getHeaders(req)
    });

    const product = response.data;
    
    res.status(200).json({success: true, log: "successfully fetched product data from endpoint /products/:id", product });
  } catch (error) {
    handleAxiosFetchError(error, res);
  }
});

export default router;
