import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { handleAxiosFetchError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken.js';
import { mapShopwareProduct } from '../utils/mapProductResponse';

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL;

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const token = await getAuthToken();

    // 🧩 Statt GET /product/:id → POST /search/product (inkl. properties)
    const requestBody = {
      filter: [{ type: 'equals', field: 'id', value: id }],
      associations: {
        properties: {
          associations: {
            group: {} // sorgt dafür, dass "Geschlecht" → group.name mitkommt
          }
        }
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

    const rawProduct = response.data?.data?.[0];

    if (!rawProduct) {
      console.warn(`⚠️ Kein Produkt mit ID ${id} gefunden.`);
      return res.status(404).json({
        success: false,
        log: `No product found with ID ${id}`,
      });
    }

    const product = mapShopwareProduct(rawProduct);

    // 🧩 Geschlecht aus den Properties lesen
    let gender = 'Unbekannt';
    if (Array.isArray(rawProduct.properties)) {
      const genderProp = rawProduct.properties.find(
        (prop: any) =>
          prop.group?.name?.toLowerCase() === 'geschlecht'
      );
      if (genderProp && genderProp.name) {
        gender = genderProp.name;
      }
    }

    product.attributes.gender = gender;
    console.log(`👕 Geschlecht für Produkt ${id}: ${gender}`);

    res.status(200).json({
      success: true,
      log: 'Successfully fetched product data (including gender)',
      product: {
        data: product   // 👈 hier product unter .data verschachteln
      }
    });
  } catch (error) {
    handleAxiosFetchError(error, res);
  }
});

export default router;
