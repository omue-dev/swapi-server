import { Request, Response } from 'express';
import * as productService from '../services/productService';

export const getProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await productService.fetchProductById(id);
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};
