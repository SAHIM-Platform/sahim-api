import { PaginationMeta } from "./pagination-meta.interface";

export interface ApiResponse<T = any> {
  message: string;
  data: T;
  meta?: PaginationMeta;
}
