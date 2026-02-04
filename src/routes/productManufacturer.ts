import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken';

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL;

router.post('/', async (req: Request, res: Response) => {
  try {
    const token = await getAuthToken();

    const requestBody = {
      limit: 5000,
      filter: [
        { type: 'not', field: 'products.id', value: null },
        { type: 'not', field: 'media.id', value: null },
      ],
    };

    const response = await axios.post(
      `${SHOPWARE_API_URL}/search/product-manufacturer`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    const manufacturers = response.data?.data || [];

    if (manufacturers.length === 0) {
      return res.status(200).json({
        data: [],
        meta: { total: 0 },
      });
    }

    const formattedManufacturers = manufacturers.map((m: any) => ({
      id: m.id,
      attributes: {
        name: m.translated?.name || m.name || 'Unbenannt',
        mediaId: m.mediaId || m.attributes?.mediaId || null,
        description: m.description || m.translated?.description || null,
        customFields: m.customFields || {},
      },
    }));

    res.status(200).json({
      data: formattedManufacturers,
      meta: { total: formattedManufacturers.length },
    });
  } catch (error) {
    handleAxiosFetchError(error, res);
  }
});

export default router;
