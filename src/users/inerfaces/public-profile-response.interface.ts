import { ThreadResponse } from '@/threads/interfaces/thread-response.interface';
import { PaginationMeta } from '@/common/interfaces/pagination-meta.interface';

export interface PublicProfileResponse {
  message: string;
  data: {
    id: number;
    name: string;
    username: string;
    role: string;
    department?: string;
    photoPath?: string | null;
    threads?: ThreadResponse[];
    threadsMeta?: PaginationMeta;
  };
}
