import { Router } from 'express';
import productManufacturerRoutes from './productManufacturer';
import productRoutes from './latestProducts';
import searchProductsRoutes from './searchProducts';
import singleProductRoutes from './singleProduct';
import relatedProductsRoutes from './relatedProducts';
import categoriesWithProductsRoutes from './categoriesWithProducts';

const router = Router();

router.use('/product-manufacturer', productManufacturerRoutes);
router.use('/products', productRoutes); 
router.use('/search-products', searchProductsRoutes);
router.use('/single-product', singleProductRoutes);
router.use('/related-products', relatedProductsRoutes);
router.use('/categories-with-products', categoriesWithProductsRoutes);

export default router;