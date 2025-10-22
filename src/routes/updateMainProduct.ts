import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { handleAxiosUpdateError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/getAuthToken.js'; // 🔄 ersetzt getHeaders

const router = Router();
const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL; // 🔄 konsistent mit allen anderen Routen

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

  const payload = {
    id,
    description: formData.description,
    metaDescription: formData.metaDescription,
    metaTitle: formData.metaTitle,
    keywords: formData.keywords,
    customFields: formData.customFields,
  };

  try {
    const token = await getAuthToken(); // 🪙 neues Token-System
    console.log(`🛠️ Updating main product ${id}...`);

    const response = await axios.patch(
      `${SHOPWARE_API_URL}/product/${id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Auth via Token
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
