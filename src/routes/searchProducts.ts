import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { isValidSortField, isValidSortDirection } from '../utils/validation';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken';
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
    return res.status(400).json({ success: false, message: `Invalid sortField: ${sortField}` });
  }

  if (!isValidSortDirection(sortDirection)) {
    return res.status(400).json({ success: false, message: `Invalid sortDirection: ${sortDirection}` });
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
    const response = await axios.post(`${SHOPWARE_API_URL}/search/product`, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const rawProducts = response.data?.data || [];

    const products = rawProducts.map(mapShopwareProduct);

    const totalProducts =
      response.data?.meta?.total ??
      response.data?.total ??
      (Array.isArray(products) ? products.length : 0);

    res.status(200).json({
      success: true,
      log: "successfully fetched search-terms from api endpoint search-products",
      products,
      totalProducts,
    });

  } catch (error: unknown) {
    handleAxiosFetchError(error, res);
  }
});

export default router;
