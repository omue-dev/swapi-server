type ProductEntity = {
  id: string;
  attributes?: {
    ean?: string | null;
    [key: string]: any;
  };
  relationships?: {
    [key: string]: {
      data?: { id: string } | { id: string }[] | null;
    };
  };
  [key: string]: any;
};

type ProductSearchResponse = {
  data?: ProductEntity[];
  included?: ProductEntity[];
  [key: string]: any;
};

type VariantEanMap = Map<string, string[]>;

const extractParentId = (variant: ProductEntity): string | undefined => {
  const parentRelationship = variant.relationships?.parent?.data;

  if (!parentRelationship) {
    return undefined;
  }

  if (Array.isArray(parentRelationship)) {
    return parentRelationship[0]?.id;
  }

  return parentRelationship.id;
};

const collectVariantEans = (included: ProductEntity[] = []): VariantEanMap => {
  const variantEanMap: VariantEanMap = new Map();

  included
    .filter((entity) => entity.type === 'product')
    .forEach((variant) => {
      const parentId = extractParentId(variant);
      if (!parentId) {
        return;
      }

      const ean = variant.attributes?.ean;
      if (!ean) {
        return;
      }

      const existing = variantEanMap.get(parentId) ?? [];
      if (!existing.includes(ean)) {
        variantEanMap.set(parentId, [...existing, ean]);
      }
    });

  return variantEanMap;
};

export const enhanceProductsWithEan = (responseData: ProductSearchResponse) => {
  const products = responseData.data ?? [];
  const variantEanMap = collectVariantEans(responseData.included);

  const enhancedProducts = products.map((product) => {
    const variantEans = variantEanMap.get(product.id) ?? [];
    const parentEan = product.attributes?.ean ?? null;
    const resolvedEan = variantEans.find(Boolean) ?? parentEan;

    return {
      ...product,
      attributes: {
        ...product.attributes,
        parentEan,
        variantEans,
        resolvedEan: resolvedEan ?? null
      }
    };
  });

  return { enhancedProducts, variantEanMap };
};

export const appendEanAssociations = (requestBody: Record<string, any>) => ({
  ...requestBody,
  associations: {
    ...(requestBody.associations ?? {}),
    children: {
      ...(requestBody.associations?.children ?? {})
    }
  }
});

export type { VariantEanMap };
