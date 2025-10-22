import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { checkCache } from '../utils/cacheMiddleware';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken.js'; // 🔄 neu: Token via Client Credentials

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL; // 🔄 vereinheitlicht: gleiche ENV-Variable wie in anderen Endpoints

// 🧩 Endpoint: Kategorien mit Produkten laden
router.post('/', checkCache, async (req: Request, res: Response) => {
  try {
    // 🪙 Token holen
    const token = await getAuthToken();
    console.log('🪙 Using token for Shopware request:', token.slice(0, 15) + '...');

    // 🧱 Request-Body vorbereiten (Filter & Sortierung)
    const requestBody = {
      filter: [
        {
          type: 'multi',
          operator: 'AND',
          queries: [
            {
              type: 'range',
              field: 'productCount',
              parameters: { gt: 0 },
            },
            {
              type: 'equals',
              field: 'active',
              value: true,
            },
          ],
        },
      ],
      sort: [
        {
          field: 'name',
          order: 'ASC',
        },
      ],
    };

    // 🛰 Anfrage an Shopware senden
    const response = await axios.post(`${SHOPWARE_API_URL}/search/category`, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // 🧠 Kategorien mappen
    const categories = (response.data?.data || []).map((category: any) => ({
      id: category.id,
      name: category.attributes?.name || category.name || 'Unbenannt',
    }));

    console.log(`✅ Shopware lieferte ${categories.length} Kategorien mit Produkten`);

    res.status(200).json({
      success: true,
      log: '✅ successfully fetched categories from endpoint /categories-with-products',
      categories,
    });
  } catch (error) {
    console.error('❌ Error in /categories-with-products endpoint:', error);
    handleAxiosFetchError(error, res);
  }
});

export default router;
