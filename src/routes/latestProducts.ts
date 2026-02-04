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
    page = 1,
    limit = 10,
    sortField = 'updatedAt',
    sortDirection = 'desc',
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
    // console.log('Filtered latest products:', req.body);
    // console.log('Manufacturer ID:', manufacturerId);

    const filters = [
      {
        type: 'range',
        field: 'stock',
        parameters: { gte: 1 }, // Lagerbestand >= 1
      },
      {
        type: 'equals',
        field: 'parentId',
        value: null, // only main products, no variants
      },
      {
        type: 'equals',
        field: 'coverId',
        value: null, // no product image
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

    if (rawProducts.length === 0) {
      return res.status(200).json({
        success: true,
        log: 'No latest products available',
        products: [],
        totalProducts: 0,
      });
    }

    const products = rawProducts.map(mapShopwareProduct);

    const totalProducts =
      response.data?.meta?.total ??
      response.data?.total ??
      (Array.isArray(products) ? products.length : 0);

    res.status(200).json({
      success: true,
      log: 'successfully fetched initial product data from endpoint /products',
      products,
      totalProducts,
    });
  } catch (error: unknown) {
    handleAxiosFetchError(error, res);
  }
});

export default router;
