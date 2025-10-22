export const mapShopwareProduct = (p: any) => ({
  id: p.id,
  attributes: {
    productNumber: p.productNumber || p.customFields?.custom_add_product_attributes_ooartikelnr || '',
    name: p.translated?.name || p.name || 'Unbenannt',
    stock: p.stock ?? 0,
    updatedAt: p.updatedAt || null,
    manufacturerId: p.manufacturerId || null,
    manufacturer: p.manufacturer || null,
    active: p.active ?? false,
    description: p.description || p.translated?.description || '',
    metaDescription: p.metaDescription || null,
    metaTitle: p.metaTitle || null,
    keywords: p.keywords || null,
    customFields: p.customFields || {},
  },
});

// 🧩 Optional flatten-Funktion
export const mapShopwareProductFlat = (p: any) => {
  const mapped = mapShopwareProduct(p);
  return {
    id: mapped.id,
    ...mapped.attributes,
  };
};
