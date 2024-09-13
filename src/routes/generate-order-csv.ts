import express from 'express';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

const router = express.Router();

// Warte auf die Existenz der Datei
const waitForFile = async (fileUrl: string, maxRetries = 10, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.head(fileUrl); // Überprüfe, ob die Datei existiert
            if (response.status === 200) {
                return true;  // Datei existiert
            }
        } catch (error) {
            console.log(`Datei noch nicht vorhanden, versuche es erneut... (Versuch ${i + 1} von ${maxRetries})`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return false;  // Datei wurde nicht gefunden
};

// Route für die CSV-Generierung
router.get('/', async (req, res) => {
    try {
        const phpScriptUrl = 'http://192.168.177.2/bestellungen-dump.php';
        await axios.get(phpScriptUrl);

        const csvUrl = 'http://192.168.177.2/bestellungen-dump/Bestellungen.csv';
        const fileExists = await waitForFile(csvUrl);

        if (!fileExists) {
            return res.status(500).send('Die CSV-Datei konnte nicht rechtzeitig erstellt werden.');
        }

        const response = await axios.get(csvUrl, { responseType: 'arraybuffer' });
        const localFilePath = path.join(process.cwd(), 'Bestellungen.csv');
        await fs.writeFile(localFilePath, response.data);

        res.download(localFilePath, 'Bestellungen.csv', async (err) => {
            if (err) {
                console.error('Fehler beim Herunterladen der CSV:', err);
                res.status(500).send('Fehler beim Herunterladen der Datei');
            }
        });

    } catch (error) {
        console.error('Fehler beim Abrufen der Bestellungen:', error);
        res.status(500).send('Fehler beim Abrufen oder Erstellen der CSV-Datei');
    }
});

export default router;
