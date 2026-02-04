const VALID_SORT_FIELDS = ['updatedAt', 'name', 'stock', 'productNumber'] as const;
const VALID_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type SortField = typeof VALID_SORT_FIELDS[number];
export type SortDirection = typeof VALID_SORT_DIRECTIONS[number];

export const isValidSortField = (sortField: string): sortField is SortField => {
  return VALID_SORT_FIELDS.includes(sortField as SortField);
};

export const isValidSortDirection = (sortDirection: string): sortDirection is SortDirection => {
  return VALID_SORT_DIRECTIONS.includes(sortDirection.toLowerCase() as SortDirection);
};
