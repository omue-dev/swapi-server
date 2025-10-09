// updateRelatedProducts.ts
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

const WRITE_PROTECTED_FIELDS = ['id', 'categoryIds'];

const prepareFormData = (formData: any) => {
    const sanitized = { ...formData };

    const descriptionHtml = convertEditorJsToHtml(sanitized.descriptionEditorJs ?? sanitized.description);
    if (descriptionHtml !== undefined) {
        sanitized.description = descriptionHtml;
    }
    delete sanitized.descriptionEditorJs;

    for (const field of WRITE_PROTECTED_FIELDS) {
        if (sanitized.hasOwnProperty(field)) {
            delete sanitized[field];
        }
    }

    return sanitized;
};

// Endpunkt zum Aktualisieren der zugehörigen Produkte
router.post('/', [authenticate], async (req: Request, res: Response) => {
    const relatedProductsIds = req.body.ids;
    const formData = prepareFormData(req.body.formData);

    try {
        const updatePromises = relatedProductsIds.map(async (relatedProductId: any) => {
            try {
                const response = await axios.request({
                    method: 'PATCH',
                    url: `${SHOPWARE_API_URL}/product/${relatedProductId}`,
                    headers: getHeaders(req),
                    data: formData,
                });

                return response.data;
            } catch (error: any) {
                if (error.response) {
                    console.error(`Error updating product ${relatedProductId}:`, error.response.data);
                    if (error.response.data.errors) {
                        error.response.data.errors.forEach((err: any) => {
                            console.error('Error detail:', {
                                code: err.code,
                                status: err.status,
                                detail: err.detail,
                                template: err.template,
                                meta: JSON.stringify(err.meta, null, 2),
                                source: JSON.stringify(err.source, null, 2),
                            });
                        });
                    }
                } else {
                    console.error(`Error updating product ${relatedProductId}:`, error.message);
                }
                throw error;
            }
        });

        const results = await Promise.all(updatePromises);

        res.status(200).json({ success: true, results });
    } catch (error: any) {
        handleAxiosUpdateError(error, res);
    }
});

export default router;
