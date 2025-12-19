import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { isValidSortField } from '../utils/vaildation';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken.js';
import { mapShopwareProduct } from '../utils/mapProductResponse';

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL;

router.post('/', async (req: Request, res: Response) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortField = 'name',
    sortDirection = 'asc',
    manufacturerId,
  } = req.body;

  if (!isValidSortField(sortField)) {
    return res.status(400).send(`Invalid sortField: ${sortField}`);
  }

  try {
    const token = await getAuthToken();

    const baseFilters = [
      {
        type: 'range',
        field: 'stock',
        parameters: { gte: 1 }, // Lagerbestand >= 1
      },
      {
        type: 'equals',
        field: 'parentId',
        value: null, // Nur Hauptprodukte, keine Varianten
      },
      {
        type: 'equals',
        field: 'coverId',
        value: null, // no product image
      },
    ];

    if (manufacturerId) {
      baseFilters.push({
        type: 'equals',
        field: 'manufacturerId',
        value: manufacturerId,
      });
    }

    // Bei Suche alle Produkte holen, die den Suchbegriff matchen, ohne zusätzliche Basisfilter
    const filters = searchTerm
      ? [
          {
            type: 'contains',
            field: 'name',
            value: searchTerm,
          },
          ...(manufacturerId
            ? [
                {
                  type: 'equals',
                  field: 'manufacturerId',
                  value: manufacturerId,
                },
              ]
            : []),
        ]
      : baseFilters;

    const requestBody = {
      limit: Number(limit),
      page: Number(page),
      filter: filters,
      sort: [
        {
          field: sortField,
          order: sortDirection,
        },
      ],
      'total-count-mode': 1, // request exact total count from Shopware
      associations: {
        properties: {
          associations: {
            group: {},
          },
        },
      },
    };
    console.log('🔎 /search-products request body:', JSON.stringify(requestBody, null, 2));

    // 🛰 Anfrage an Shopware senden
    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const rawProducts = response.data?.data || [];
    // console.log('📦 Shopware meta for /search-products:', response.data?.meta);
    if (rawProducts[0]) {
      console.log('🖼️ First raw product coverId (search):', rawProducts[0]?.coverId ?? rawProducts[0]?.attributes?.coverId ?? null);
    }

    // 🧩 Einheitliches Mapping mit Utility-Funktion
    const products = rawProducts.map(mapShopwareProduct);

    const totalProducts =
      response.data?.meta?.total ??
      response.data?.total ??
      (Array.isArray(products) ? products.length : 0);

    // console.log(`✅ Shopware lieferte ${products.length} Produkte (total: ${totalProducts})`);
    // console.log("🧩 Erstes Produkt:", JSON.stringify(products[0], null, 2));

    res.status(200).json({
      success: true,
      log: "successfully fetched search-terms from api endpoint search-products",
      products,
      totalProducts,
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error in /search-products:", error.message);
    } else {
      console.error("❌ Unknown error in /search-products:", error);
    }

    // Optional: Shopware-spezifische Fehlerausgabe
    if ((error as any)?.response) {
      console.error("📦 Shopware API error response:", (error as any).response.data);
    }

    handleAxiosFetchError(error, res);
  }
});

export default router;
