import { Router } from 'express';
import productManufacturerRoutes from './productManufacturer';
import productRoutes from './latestProducts';
import searchProductsRoutes from './searchProducts';

const router = Router();

router.use(productManufacturerRoutes);
router.use(productRoutes); 
router.use(searchProductsRoutes);

export default router;