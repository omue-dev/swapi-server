export const isValidSortField = (sortField: string): boolean => {
    const validSortFields = ['updatedAt', 'name', 'stock', 'productNumber'];
    return validSortFields.includes(sortField);
  };
  