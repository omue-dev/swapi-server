import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { handleAxiosUpdateError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';
import { convertEditorJsToHtml } from '../utils/editorJsAdapter';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

const buildPayload = (formData: any) => {
    const descriptionHtml = convertEditorJsToHtml(formData.descriptionEditorJs ?? formData.description);

    const payload: Record<string, unknown> = {
        id: formData.id,
        metaDescription: formData.metaDescription,
        metaTitle: formData.metaTitle,
        keywords: formData.keywords,
        customFields: formData.customFields,
    };

    if (descriptionHtml !== undefined) {
        payload.description = descriptionHtml;
    }

    return payload;
};

// Endpunkt zum Aktualisieren des Hauptprodukts
router.post('/', [authenticate], async (req: Request, res: Response) => {
    const formData = req.body;
    const id = formData.id;

    const payload = buildPayload(formData);

    const options = {
        method: 'PATCH',
        url: `${SHOPWARE_API_URL}/product/${id}`,
        headers: getHeaders(req),
        data: payload,
    };

    try {
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
