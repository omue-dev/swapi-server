import axiosInstance from '../utils/axiosInstance';
import { Product } from '../interfaces/types';

export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await axiosInstance.get(`/products/${id}`);
  const item = response.data;
  const attributes = item.data.attributes || {};
  const customFields = attributes.customFields || {};
  const categoryIds = attributes.categoryIds || [];

  return {
    id: item.data.id,
    name: attributes.name || '',
    active: attributes.active || false,
    description: attributes.description || '',
    customSearchKeywords: attributes.customSearchKeywords || '',
    ean: attributes.ean || '',
    metaDescription: attributes.metaDescription || '',
    metaTitle: attributes.metaTitle || '',
    keywords: attributes.keywords || '',
    categoryIds: categoryIds,
    productNumber: attributes.productNumber || '',
    shortText: customFields.custom_add_product_attributes_short_text || '',
    stock: attributes.stock || 0
  };
};
