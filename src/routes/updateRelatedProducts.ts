import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { handleAxiosUpdateError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken.js'; // 🔄 ersetzt getHeaders

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL; // 🔄 vereinheitlicht

// 🧹 Funktion zur Bereinigung der Formdaten
const cleanFormData = (formData: any) => {
  const writeProtectedFields = ['id', 'categoryIds']; // nicht änderbare Felder
  for (const field of writeProtectedFields) {
    if (formData.hasOwnProperty(field)) {
      delete formData[field];
    }
  }
  return formData;
};

// 🧩 Endpunkt zum Aktualisieren mehrerer zugehöriger Produkte
router.post('/', async (req: Request, res: Response) => {
  const relatedProductsIds = req.body.ids;
  let formData = req.body.formData;

  if (!Array.isArray(relatedProductsIds) || relatedProductsIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No related product IDs provided.',
    });
  }

  // Schreibgeschützte Felder entfernen
  formData = cleanFormData(formData);

  try {
    const token = await getAuthToken(); // 🪙 Neues Token-System
    console.log(`🧩 Updating ${relatedProductsIds.length} related products...`);

    // 🔁 Parallelisierte PATCH-Anfragen
    const updatePromises = relatedProductsIds.map(async (relatedProductId: string) => {
      try {
        const response = await axios.patch(
          `${SHOPWARE_API_URL}/product/${relatedProductId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`✅ Produkt ${relatedProductId} erfolgreich aktualisiert.`);
        return { id: relatedProductId, status: 'success', data: response.data };
      } catch (error: any) {
        console.error(`❌ Fehler beim Aktualisieren von Produkt ${relatedProductId}:`, error.message);

        if (error.response) {
          console.error('📦 Shopware response:', JSON.stringify(error.response.data, null, 2));
        }

        return { id: relatedProductId, status: 'error', error: error.message };
      }
    });

    // 🧠 Alle Requests abwarten
    const results = await Promise.all(updatePromises);

    console.log(`🧮 Update abgeschlossen: ${results.length} Produkte verarbeitet.`);

    res.status(200).json({
      success: true,
      log: 'All related products updated successfully',
      results,
    });
  } catch (error) {
    console.error('❌ Fehler im /update-related-products Endpoint:', error);
    handleAxiosUpdateError(error, res);
  }
});

export default router;
