import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { checkCache, redisClient } from '../utils/cacheMiddleware'; 
import { handleAxiosUpdateError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

//Endpunkt zum Aktualisieren von Produkten
router.post('/', [authenticate, checkCache], async (req: Request, res: Response) => {
  console.log("/update-product"); // Log-Ausgabe zum Überprüfen des Aufrufs
    const formData = req.body;
    const id = formData.id;
  
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
      headers: getHeaders(req),
      data: payload
    };
  
    const delCategory = {
      method: 'DELETE',
      url: `${SHOPWARE_API_URL}/product/${id}/categories/018a0e41a67974a1838844b6e04265bc`,
      headers: getHeaders(req)
    }
  
    try {
      if (formData.categoryIds.length > 0 && formData.categoryIds.includes('018a0e41a67974a1838844b6e04265bc')) {
        await axios.request({
          ...delCategory,
          method: 'DELETE',
        });
        console.log('Category successfully removed');
      }
  
      const { data } = await axios.request({
        ...options,
        method: 'PATCH',
      });
  
      // Cache-Invalidierung
      const cacheKeys = await redisClient.keys('products:*');
      if (cacheKeys.length > 0) {
        await redisClient.del(cacheKeys);
      }
      
      res.status(200).json({ success: true, data });
    } catch (error: any) {
        handleAxiosUpdateError(error, res);
    }
  });

  export default router;