import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateThreadDto } from '../dto/create-thread.dto';
import { UpdateThreadDto } from '../dto/update-thread.dto';
import { ThreadQueryDto } from '../dto/thread-query.dto';
import { SortType } from '../enum/sort-type.enum';
import { ThreadWithDetails } from '../types/threads.types';
import { FindOneThreadQueryDto } from '../dto/find-thread-query.dto';
import { buildThreadIncludeOptions, formatVotes } from '../utils/threads.utils';
import { CategoryNotFoundException } from '@/admins/exceptions/category-not-found.exception';
import { Prisma, Thread } from '@prisma/client';
import { SearchThreadsDto } from '../dto/search-threads.dto';
import { formatThreadResponse } from '../utils/threads.utils';
import { ApiResponse } from '@/common/interfaces/api-response.interface';
import { ThreadResponse } from '../interfaces/thread-response.interface';
import { CategoryResponse } from '../interfaces/category-response.interface';

@Injectable()
export class ThreadService {
  constructor(private prisma: PrismaService) { }

  /**
   * Searches for threads with pagination and filtering options.
   * Performs case-insensitive search across thread titles and content.
   * 
   * @param {Object} params - Search and pagination parameters
   * @param {string} params.query - The search query string
   * @param {SortType} [params.sort=SortType.LATEST] - Sort order (LATEST/OLDEST)
   * @param {number} [params.page=1] - Current page number (1-based)
   * @param {number} [params.limit=10] - Number of results per page
   * @param {number} [params.category_id] - Optional category ID to filter results
   * @param {number} [userId] - Optional user ID for personalized results (votes/bookmarks)
   * 
   * @returns {Promise<{data: ThreadWithDetails[], meta: PaginationMeta}>} - Paginated results
   */
  async searchThreads(
    { query, sort = SortType.LATEST, page = 1, limit = 10, category_id }: SearchThreadsDto,
    userId?: number
  ): Promise<ApiResponse<Thread[]>> {
    const orderBy = {
      created_at: sort === SortType.LATEST ? 'desc' as const : 'asc' as const,
    };
  
    const where: Prisma.ThreadWhereInput = {
      AND: [
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
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
          author: { select: { id: true, username: true, name: true, photoPath: true } },
          category: true,
          _count: { select: { comments: true, votes: true } },
          votes: { select: { vote_type: true, voter_user_id: true } },
          bookmarks: userId
            ? { where: { user_id: userId }, select: { user_id: true } }
            : false,
        },
      }),
      this.prisma.thread.count({ where }),
    ]);

    const data =  threads.map(({ bookmarks, ...thread }) => ({
      ...thread,
      votes: formatVotes(thread.votes, userId),
      bookmarked: !!(bookmarks?.some(b => b.user_id === userId)),
    }))
  
    return {
      message: 'Threads retrieved successfully',
      data,
      meta: { 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit),
        query, 
      },
    };
  }
  
  /**
   * Creates a new thread
   * @param userId - ID of the user creating the thread
   * @param createThreadDto - Data for the new thread
   * @returns The created thread with author information and vote counts
   * @throws CategoryNotFoundException if category doesn't exist
   */
  async create(userId: number, createThreadDto: CreateThreadDto): Promise<ApiResponse<ThreadResponse>> {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { category_id: createThreadDto.category_id },
    });

    if (!category) {
      throw new CategoryNotFoundException(createThreadDto.category_id);
    }

    const thread = await this.prisma.thread.create({
      data: {
        ...createThreadDto,
        author_user_id: userId,
      },
      include: {
        author: { select: { id: true, username: true, name: true, photoPath: true } },
        category: true,
        _count: { select: { comments: true, votes: true } },
        votes: { select: { vote_type: true, voter_user_id: true } },
      },
    });

    return {
      message: 'Thread created successfully',
      data: {
        ...thread,
        votes: formatVotes(thread.votes),
      },
    };
  }

  /**
   * Retrieves a paginated list of threads with optional sorting
   * @param query - Query parameters including sort type, page, and limit
   * @returns Paginated list of threads with metadata
   */
  async findAll({ sort = SortType.LATEST, page = 1, limit = 10 , category_id}: ThreadQueryDto, userId?: number): Promise<ApiResponse<Thread[]>> {
    const orderBy = {
      created_at: sort === SortType.LATEST ? 'desc' as const : 'asc' as const,
    };

    // Filter by category if provided
    const where = category_id ? { category_id } : {};

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, username: true, name: true, photoPath: true } },
          category: true,
          _count: { select: { comments: true, votes: true } },
          votes: { select: { vote_type: true, voter_user_id: true } },
          bookmarks: userId
            ? { where: { user_id: userId }, select: { user_id: true } }
            : false,
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
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Retrieves a single thread with detailed information
   * @param threadId - ID of the thread to retrieve
   * @param options - Query options for comments and votes inclusion
   * @param userId - Optional ID of the requesting user for vote status
   * @returns The requested thread with formatted votes and optional comments
   * @throws NotFoundException if thread doesn't exist
   */
  async findOne(
    threadId: number,
    options?: FindOneThreadQueryDto,
    userId?: number,
  ): Promise<ApiResponse<ThreadWithDetails>> {
    const {
      includeComments = true,
      commentsPage = 1,
      commentsLimit = 10,
      includeVotes = true
    } = options || {};

    const thread = await this.prisma.thread.findUnique({
      where: { thread_id: threadId },
      include: {
        ...buildThreadIncludeOptions(includeComments, includeVotes, commentsPage, commentsLimit),
        bookmarks: userId
          ? { where: { user_id: userId }, select: { user_id: true } }
          : false,
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const data = formatThreadResponse(thread, userId, includeComments, includeVotes);
    
    return {
      message: 'Thread retrieved successfully',
      data,
    }
  }

  /**
   * Updates an existing thread
   * @param userId - ID of the user attempting the update
   * @param id - ID of the thread to update
   * @param updateThreadDto - Data to update the thread with
   * @returns The updated thread
   * @throws ForbiddenException if user doesn't own the thread
   */
  async update(userId: number, id: number, updateThreadDto: UpdateThreadDto): Promise<ApiResponse<ThreadResponse>> {
    const thread = await this.getThreadById(id);
    if (thread.author_user_id !== userId) {
      throw new ForbiddenException('You can only update your own threads');
    }

    const updatedThread = await this.prisma.thread.update({
      where: { thread_id: id },
      data: updateThreadDto,
      include: {
        author: { select: { id: true, username: true, name: true, photoPath: true } },
        category: true,
        votes: { select: { vote_type: true, voter_user_id: true } },
      },
    });

    return {
      message: 'Thread updated successfully',
      data: {
        ...updatedThread,
        votes: formatVotes(updatedThread.votes),
      },
    };
  }

  /**
   * Deletes a thread
   * @param userId - ID of the user attempting deletion
   * @param id - ID of the thread to delete
   * @returns Success status
   * @throws ForbiddenException if user doesn't own the thread
   */
  async remove(userId: number, id: number): Promise<ApiResponse<null>> {
    const thread = await this.getThreadById(id);
    if (thread.author_user_id !== userId) {
      throw new ForbiddenException('You can only delete your own threads');
    }

    await this.prisma.thread.delete({ where: { thread_id: id } });
    return {
      message: 'Thread deleted successfully',
      data: null,
    }
  }


  /**
   * Retrieves a thread by ID with basic validation
   * @param threadId - ID of the thread to retrieve
   * @returns The requested thread
   * @throws NotFoundException if thread doesn't exist
   * @private
   */
  private async getThreadById(threadId: number) {
    const thread = await this.prisma.thread.findUnique({ where: { thread_id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');
    return thread;
  }


  /**
   * Verifies if the thread exists
   * @param threadId - ID of the thread to check
   * @throws NotFoundException if thread doesn't exist
   */
  async ensureThreadExists(threadId: number) {
    const thread = await this.prisma.thread.findUnique({ where: { thread_id: threadId } });
    if (!thread) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }
  }

  /**
   * Retrieves all available thread categories.
   * 
   * @returns {Promise<{ data: Array<{ category_id: number, name: string }> }>} List of categories.
   * @throws NotFoundException if no categories exist
   */
  async getAllCategories(): Promise<ApiResponse<CategoryResponse[]>> {
    const categories = await this.prisma.category.findMany({
      select: {
        category_id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }
}