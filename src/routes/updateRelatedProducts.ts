import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { handleAxiosUpdateError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken.js';

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL;

// 🧩 Mapping für Geschlechter → Property-Option-IDs
const genderMap: Record<string, string> = {
  Herren: "018a4585e4437be7ab54ba0ff589bb45",
  Damen: "018a45866d8a7349bea228f98f2f48a1",
  Unisex: "018a4586ac097640aac8f5906a0dc22e",
  Kids: "018a45875450739d8ed5a67fbeda0244",
};

// Fixe Property Group ID (Geschlecht)
const GENDER_GROUP_ID = "018a4581b03a7d8bbc3d9c582f924bc3";

// 🧹 Funktion zur Bereinigung der Formdaten
const cleanFormData = (formData: any) => {
  const writeProtectedFields = ['id', 'categoryIds'];
  for (const field of writeProtectedFields) {
    delete formData[field];
  }
  return formData;
};

// 🧩 Endpunkt zum Aktualisieren mehrerer zugehöriger Produkte
router.post('/', async (req: Request, res: Response) => {
  const updates = req.body.updates;
  const relatedProductsIds = Array.isArray(updates)
    ? updates.map((u: any) => u.id)
    : req.body.ids;
  let formData = req.body.formData;

  if (!Array.isArray(relatedProductsIds) || relatedProductsIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No related product IDs provided.',
    });
  }

  // Schreibgeschützte Felder entfernen
  formData = cleanFormData(formData);

  // 👇 Gender zu Properties hinzufügen, falls vorhanden
  const genderValue =
    formData.gender || formData.customFields?.custom_add_product_attributes_gender;

  if (genderValue && genderMap[genderValue]) {
    formData.properties = [
      {
        id: genderMap[genderValue],
        groupId: GENDER_GROUP_ID,
      },
    ];
  }

  try {
    const token = await getAuthToken();
    console.log(`🧩 Updating ${relatedProductsIds.length} related products...`);

    // 🔁 Parallelisierte PATCH-Anfragen
    const updatePromises = relatedProductsIds.map(async (relatedProductId: string) => {
      try {
        const updateEntry = Array.isArray(updates)
          ? updates.find((u: any) => u.id === relatedProductId)
          : null;
        const payload =
          updateEntry && updateEntry.name
            ? { ...formData, name: updateEntry.name }
            : formData;

        const response = await axios.patch(`${SHOPWARE_API_URL}/product/${relatedProductId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

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
