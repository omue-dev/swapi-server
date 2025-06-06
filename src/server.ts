import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import router from './routes';
import generateOrderCsvRouter from './routes/generate-order-csv';  // Der neue Endpunkt

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline';");
  res.removeHeader("X-Content-Security-Policy");
  res.removeHeader("X-WebKit-CSP");
  next();
});

app.use(express.json());
app.use('/api', router);  // Basisroute festlegen
router.use('/generate-order.csv', generateOrderCsvRouter);

// Fehlerbehandlungs-Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  if (err.response) {
    console.error('Error response data:', err.response.data);
    console.error('Error response status:', err.response.status);
    console.error('Error response headers:', err.response.headers);
    res.status(err.response.status).send(err.response.data);
  } else if (err.request) {
    console.error('Error request:', err.request);
    res.status(500).send('Error in making request');
  } else {
    console.error('General Error message:', err.message);
    res.status(500).send('An unknown error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
