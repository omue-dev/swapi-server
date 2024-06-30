import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { handleAxiosUpdateError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

// Endpunkt zum Aktualisieren des Hauptprodukts
router.post('/', [authenticate], async (req: Request, res: Response) => {
    const formData = req.body;
    const id = formData.id;

    const payload = {
        id: formData.id,
        description: formData.description,
        metaDescription: formData.metaDescription,
        metaTitle: formData.metaTitle,
        keywords: formData.keywords,
        customFields: formData.customFields
    };

    const options = {
        method: 'PATCH',
        url: `${SHOPWARE_API_URL}/product/${id}`,
        headers: getHeaders(req),
        data: payload
    };

    try {
        //console.log(`PATCH request to ${options.url} with data:`, options.data); // Logging hinzugefügt

        const { data } = await axios.request({
            ...options,
            method: 'PATCH',
        });

        res.status(200).json({ success: true, data });
    } catch (error: any) {
        handleAxiosUpdateError(error, res);
    }
});

export default router;
