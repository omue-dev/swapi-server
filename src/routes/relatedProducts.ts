import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { checkCache } from '../utils/cacheMiddleware';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken';
import { mapShopwareProductFlat } from '../utils/mapProductResponse';

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL;

// Endpunkt für das Abrufen verwandter Produkte
router.post('/', checkCache, async (req: Request, res: Response) => {
  const { productName } = req.body;

  if (!productName) {
    return res.status(400).json({
      success: false,
      log: 'Product name is required',
    });
  }

  try {
    // 🪙 Neues Token holen
    const token = await getAuthToken();

    const name = productName.split(',')[0]; // nur den ersten Teil
    const requestBody = {
      filter: [
        {
          type: 'multi',
          operator: 'AND',
          queries: [
            {
              type: 'contains',
              field: 'name',
              value: name,
            },
            {
              type: 'range',
              field: 'name',
              parameters: {
                gte: name,
                lt: name + '\uFFFF',
              },
            },
          ],
        },
        {
          type: 'equals',
          field: 'parentId',
          value: null,
        },
      ],
      limit: 20,
      'total-count-mode': 'exact',
      associations: {
        properties: {
          associations: {
            group: {},
          },
        },
      },
    };

    const response = await axios.post(
      `${SHOPWARE_API_URL}/search/product`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    const rawProducts = response.data?.data || [];

    if (rawProducts.length === 0) {
      return res.status(200).json({
        success: true,
        log: `No related products found for "${productName}"`,
        relatedProducts: [],
      });
    }

    const relatedProducts = rawProducts.map(mapShopwareProductFlat);

    res.status(200).json({
      success: true,
      log: 'successfully fetched related products from /related-products',
      relatedProducts,
    });
  } catch (error) {
    handleAxiosFetchError(error, res);
  }
});

export default router;
