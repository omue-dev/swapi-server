import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';

const router = Router();
const SHOPWARE_API_URL = 'https://www.weltenbummler-erkelenz.de/api';

router.post('/search/product-manufacturer', authenticate, async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${SHOPWARE_API_URL}/search/product-manufacturer`, {
      limit: 5000,
      filter: [
        {
          type: 'not',
          field: 'products.id',
          value: null
        },
        {
          type: 'not',
          field: 'media.id',
          value: null
        }
      ]
    }, {
      headers: {
        'Accept': 'application/vnd.api+json, application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers['Authorization']!
      }
    });

    const manufacturersWithMedia = response.data.data.filter((item: any) => item.attributes.mediaId);
    //console.log('Manufacturers with Products and Media:', manufacturersWithMedia); // Protokolliere die Hersteller mit Media

    res.json({ data: manufacturersWithMedia });
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    if (axios.isAxiosError(error)) {
      res.status(500).send(error.response?.data || error.message);
    } else {
      res.status(500).send('An unknown error occurred');
    }
  }
});

export default router;
