import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { isValidSortField } from '../utils/vaildation';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken.js';
import { mapShopwareProduct } from '../utils/mapProductResponse'; // 🧩 NEU

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL;

// Endpunkt für das Abrufen der Artikel
router.post('/', async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    sortField = 'updatedAt',
    sortDirection = 'desc',
    manufacturerId,
  } = req.body;

  if (!isValidSortField(sortField)) {
    return res.status(400).send(`Invalid sortField: ${sortField}`);
  }

  try {
    const token = await getAuthToken();
    console.log('🪙 Using token for Shopware request:', token.slice(0, 15) + '...');

    const filters = [
      {
        type: 'range',
        field: 'stock',
        parameters: { gte: 1 },
      },
      {
        type: 'equals',
        field: 'active',
        value: false,
      },
    ];

    if (manufacturerId) {
      filters.push({
        type: 'equals',
        field: 'manufacturerId',
        value: manufacturerId,
      });
    }

    const requestBody = {
      limit: Number(limit),
      page: Number(page),
      filter: filters,
      sort: [{ field: sortField, order: sortDirection }],
      'total-count-mode': 'exact',
    };

    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const rawProducts = response.data?.data || [];

    // 🧩 Wenn keine Produkte vorhanden sind → trotzdem 200 OK zurückgeben
    if (rawProducts.length === 0) {
      console.warn('⚠️ Keine neuesten Produkte gefunden');
      return res.status(200).json({
        success: true,
        log: 'No latest products available',
        products: [],
        totalProducts: 0,
      });
    }

    // 🧩 Mapping Utility nutzen statt Inline-Code
    const products = rawProducts.map(mapShopwareProduct);

    const totalProducts =
      response.data?.meta?.total ??
      (Array.isArray(products) ? products.length : 0);

    console.log(`✅ Shopware lieferte ${products.length} Produkte (total: ${totalProducts})`);
    console.log('🧩 Erstes Produkt:', JSON.stringify(products[0], null, 2));

    res.status(200).json({
      success: true,
      log: 'successfully fetched initial product data from endpoint /products',
      products,
      totalProducts,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error in /products endpoint:', error.message);
    } else {
      console.error('❌ Unknown error in /products endpoint:', error);
    }

    handleAxiosFetchError(error, res);
  }
});

export default router;
