export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query?: string;
  search?: string;
  category_id?: number;
}
