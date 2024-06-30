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

// Endpunkt für das Abrufen verwandter Produkte
router.post('/', authenticate, checkCache, async (req: Request, res: Response) => {
  const { productName } = req.body;
  //console.log("productName: " + productName); // Log-Ausgabe zum Überprüfen des Aufrufs

    if (!productName) {
      return res.status(400).send('Product name is required');
    }
  
    try {
      const requestBody = {
        filter: [
            {
                type: 'multi',
                operator: 'AND',
                queries: [
                    {
                        type: 'contains',
                        field: 'name',
                        value: productName.split(',')[0]
                    },
                    {
                        type: 'range',
                        field: 'name',
                        parameters: {
                            gte: productName.split(',')[0],
                            lt: productName.split(',')[0] + '\uFFFF'
                        }
                    }
                ]
            },
            {
                type: 'equals',
                field: 'parentId',
                value: null
            }
        ]
    };
      
      const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, requestBody, {
        headers: getHeaders(req)
      });
  
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
  
      res.status(200).json({ success: true, log: "successfully fetched related products from api endpoint relatedproducts", relatedProducts });

    } catch (error) {
        handleAxiosFetchError(error, res);
    }
  });

  export default router;