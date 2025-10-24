import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { handleAxiosUpdateError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken.js';

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL;

// 🎯 Mapping für Geschlecht -> Property-Option-ID
const genderMap: Record<string, string> = {
  Herren: "018a4585e4437be7ab54ba0ff589bb45",
  Damen: "018a45866d8a7349bea228f98f2f48a1",
  Unisex: "018a4586ac097640aac8f5906a0dc22e",
  Kids: "018a45875450739d8ed5a67fbeda0244",
};

// Fixe Group-ID für Geschlecht
const GENDER_GROUP_ID = "018a4581b03a7d8bbc3d9c582f924bc3";

// 🧩 Endpunkt zum Aktualisieren des Hauptprodukts
router.post('/', async (req: Request, res: Response) => {
  const formData = req.body;
  const { id } = formData;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Missing product ID',
    });
  }

  // Grunddaten zusammenstellen
  const payload: any = {
    id,
    description: formData.description,
    metaDescription: formData.metaDescription,
    metaTitle: formData.metaTitle,
    keywords: formData.keywords,
    customFields: formData.customFields,
  };

  // 🧠 Wenn ein Gender-Wert gesetzt ist → füge die korrekte Property-Referenz hinzu
  const genderValue =
    formData.gender || formData.customFields?.custom_add_product_attributes_gender;

  if (genderValue && genderMap[genderValue]) {
    payload.properties = [
      {
        id: genderMap[genderValue],
        groupId: GENDER_GROUP_ID,
      },
    ];
  }

  try {
    const token = await getAuthToken();

    console.log(`🛠️ Updating main product ${id}...`);

    const response = await axios.patch(
      `${SHOPWARE_API_URL}/product/${id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Produkt ${id} erfolgreich aktualisiert.`);
    res.status(200).json({
      success: true,
      log: `Product ${id} updated successfully`,
      data: response.data,
    });
  } catch (error) {
    console.error(`❌ Fehler beim Aktualisieren von Produkt ${id}:`, error);
    handleAxiosUpdateError(error, res);
  }
});

export default router;
