import { Router } from 'express';
import productManufacturerRoutes from './productManufacturer';
import productRoutes from './latestProducts'; // Import der neuen Produkt-Routen
import sameProduct from './sameProduct';

const router = Router();

router.use(productManufacturerRoutes);
router.use(productRoutes); // Verwenden der neuen Produkt-Routen
router.use(sameProduct); // Verwenden der neuen Produkt-Routen

export default router;
