// updateRelatedProducts.ts
import dotenv from 'dotenv';
dotenv.config();
import { Router, Request, Response } from 'express';
import axios from 'axios';
import authenticate from '../middleware/authenticate';
import { handleAxiosUpdateError } from '../utils/errorHandler';
import { getHeaders } from '../utils/headers';

const router = Router();
const SHOPWARE_API_URL = process.env.API_BASE_URL;

// Funktion zur Validierung und Säuberung von formData
const cleanFormData = (formData: any) => {
    const writeProtectedFields = ['id', 'categoryIds']; // Liste der schreibgeschützten Felder
    for (const field of writeProtectedFields) {
        if (formData.hasOwnProperty(field)) {
            delete formData[field];
        }
    }
    return formData;
};

// Endpunkt zum Aktualisieren der zugehörigen Produkte
router.post('/', [authenticate], async (req: Request, res: Response) => {
    const relatedProductsIds = req.body.ids;
    let formData = req.body.formData;

    // Entfernen der schreibgeschützten Felder
    formData = cleanFormData(formData);

    //console.log('relatedProductsIds:', relatedProductsIds);
    //console.log('formData:', formData);
    
    try {
        // Verarbeitung der Anfragen an die zugehörigen Produkte
        const updatePromises = relatedProductsIds.map(async (relatedProductId: any) => {
            //console.log('relatedProductId:', relatedProductId);

            try {
                const response = await axios.request({
                    method: 'PATCH',
                    url: `${SHOPWARE_API_URL}/product/${relatedProductId}`, // Annahme: Endpunkt zur Aktualisierung eines Produkts nach seiner ID
                    headers: getHeaders(req),
                    data: formData // Senden der gesamten Produktinformationen ohne die schreibgeschützten Felder
                });

                return response.data; // Optional: Du könntest die Antwort hier verarbeiten oder einfach weitergeben
            } catch (error: any) {
                // Detaillierte Protokollierung des Fehlers
                if (error.response) {
                    console.error(`Error updating product ${relatedProductId}:`, error.response.data);
                    if (error.response.data.errors) {
                        error.response.data.errors.forEach((err: any) => {
                            console.error('Error detail:', {
                                code: err.code,
                                status: err.status,
                                detail: err.detail,
                                template: err.template,
                                meta: JSON.stringify(err.meta, null, 2), // Details des meta-Objekts
                                source: JSON.stringify(err.source, null, 2) // Details des source-Objekts
                            });
                        });
                    }
                } else {
                    console.error(`Error updating product ${relatedProductId}:`, error.message);
                }
                throw error;
            }
        });

        // Alle Anfragen gleichzeitig durchführen und auf Abschluss warten
        const results = await Promise.all(updatePromises);

        res.status(200).json({ success: true, results });
    } catch (error: any) {
        handleAxiosUpdateError(error, res);
    }
});

export default router;
