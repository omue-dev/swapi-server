import { Router } from 'express';
import { getProduct } from '../controllers/productController';

const router = Router();

router.get('/products/:id', getProduct);

export default router;
