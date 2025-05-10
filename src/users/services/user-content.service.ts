import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SortType } from '@/threads/enum/sort-type.enum';
import { formatVotes } from '@/threads/utils/threads.utils';
import { BookmarksQueryDto } from '../dto/bookmarks-query.dto';
import { Prisma, Thread } from '@prisma/client';
import { ApiResponse } from '@/common/interfaces/api-response.interface';
import { ThreadQueryDto } from '@/threads/dto/thread-query.dto';


@Injectable()
export class UserContentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all threads created by the specified user with pagination and optional search.
   * 
   * @param userId - ID of the user whose threads to retrieve
   * @param query - Query parameters for pagination, sorting, and searching
   * @returns Paginated list of threads with the a similar structure to GET /threads
   */
  async getUserThreads(userId: number, query: ThreadQueryDto): Promise<ApiResponse<Thread[]>> {
    const { sort = SortType.LATEST, page = 1, limit = 10, search, category_id } = query;

    const orderBy = {
      created_at: sort === SortType.LATEST ? 'desc' as const : 'asc' as const,
    };

    const formattedSearch = search?.trim().split(/\s+/).join(' & ');

    const where: Prisma.ThreadWhereInput = {
      author_user_id: userId,
      AND: [
        ...(search ? [{
          OR: [
            { title: { search: formattedSearch, mode: Prisma.QueryMode.insensitive } },
            { content: { search: formattedSearch, mode: Prisma.QueryMode.insensitive } },
          ],
        }] : []),
        ...(category_id ? [{ category_id }] : []),
      ],
    };

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, username: true, name: true, photoPath: true, role: true, student: { select: { department: true }}, isDeleted: true } },
          category: true,
          _count: { select: { comments: true, votes: true } },
          votes: { select: { vote_type: true, voter_user_id: true } },
          bookmarks: { where: { user_id: userId }, select: { user_id: true } },
        },
      }),
      this.prisma.thread.count({ where }),
    ]);

    const data = threads.map(({ bookmarks, ...thread }) => ({
        ...thread,
        votes: formatVotes(thread.votes, userId),
        bookmarked: !!(bookmarks?.some(b => b.user_id === userId)),
      }));

    return {
      message: 'Threads retrieved successfully',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        ...(search && { search }),
        ...(category_id && { category_id }),
      },
    };
  }

    /**
     * Retrieves all bookmarks for a specific user with pagination.
     * 
     * @param {number} userId - The ID of the user whose bookmarks are to be retrieved.
     * @param {BookmarksQueryDto} query - Query parameters for pagination and sorting.
     * @returns {Promise<Object>} A paginated list of bookmarked threads with the same structure as GET /threads.
     */
    async getUserBookmarks(userId: number, query: BookmarksQueryDto = {}): Promise<ApiResponse<Thread[]>> {
      const { sort = SortType.LATEST, page = 1, limit = 10 } = query;
  
      const orderBy = {
        created_at: sort === SortType.LATEST ? 'desc' as const : 'asc' as const,
      };
  
      // Get all bookmarked thread IDs for the user
      const bookmarkedThreads = await this.prisma.bookmarkedThread.findMany({
        where: { user_id: userId },
        select: { thread_id: true },
        orderBy: { thread: { created_at: 'desc' } },
      });
  
      const threadIds = bookmarkedThreads.map(bookmark => bookmark.thread_id);
  
      // If no bookmarks, return empty result with the same structure
      if (threadIds.length === 0) {
        return {
        message: 'No bookmarks found',
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }
  
      // Get the total count of bookmarked threads
      const total = threadIds.length;
  
      // Get the threads with pagination
      const threads = await this.prisma.thread.findMany({
        where: { thread_id: { in: threadIds } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, username: true, name: true, photoPath: true, role: true, student: { select: { department: true }}, isDeleted: true } },
          category: true,
          _count: { select: { comments: true, votes: true } },
          votes: { select: { vote_type: true, voter_user_id: true } },
        },
      });

      const data =  threads.map(thread => ({
        ...thread,
        votes: formatVotes(thread.votes, userId),
        bookmarked: true, // All threads in this response are bookmarked
      }));
  
      return {
        message: 'Bookmarks retrieved successfully',
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
      };
    }
}
