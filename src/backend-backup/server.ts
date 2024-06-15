import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes';

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline';");
  res.removeHeader("X-Content-Security-Policy");
  res.removeHeader("X-WebKit-CSP");
  next();
});

// Verwende die Routen
app.use('/api', routes);

// Statische Dateien aus dem dist-Ordner bereitstellen
app.use(express.static(path.join(__dirname, 'dist')));

// Für alle anderen Routen die index.html zurückgeben
app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    res.status(404).send('API endpoint not found');
  } else {
    res.sendFile(path.join(__dirname, 'dist', 'index.html')); // Korrekte Pfadangabe
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
