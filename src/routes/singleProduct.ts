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

    const response = await axios.get(`${SHOPWARE_API_URL}/product/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const rawProduct = response.data?.data || response.data;

    // ✅ Falls kein Produkt gefunden wird → sauber abbrechen
    if (!rawProduct) {
      console.warn(`⚠️ Kein Produkt mit ID ${id} gefunden.`);
      return res.status(404).json({
        success: false,
        log: `No product found with ID ${id}`,
      });
    }

    // ✅ Mapping absichern
    const product = mapShopwareProduct(rawProduct);
    if (!product || !product.attributes) {
      console.error(`❌ Produkt ${id} konnte nicht korrekt gemappt werden.`);
      return res.status(500).json({
        success: false,
        log: `Product mapping failed for ID ${id}`,
      });
    }

    console.log(`✅ Produkt ${id} erfolgreich gemappt.`);
    console.log('🧩 Produktvorschau:', JSON.stringify(product, null, 2));

    // ✅ Einheitliches Response-Format
    res.status(200).json({
      success: true,
      log: 'successfully fetched product data from endpoint /products/:id',
      product: {
          data: { // 👈 füge data hinzu, damit das Frontend happy ist
          id: product.id,
          attributes: product.attributes
        }
      },
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ Fehler beim Laden von Produkt ${req.params.id}:`, error.message);
    } else {
      console.error(`❌ Fehler beim Laden von Produkt ${req.params.id}:`, error);
    }
    handleAxiosFetchError(error, res);
  }
});

export default router;
