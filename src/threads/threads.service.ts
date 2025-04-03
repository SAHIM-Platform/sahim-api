import {
    Injectable,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { PrismaService } from '../../prisma/prisma.service';
  import { CreateThreadDto } from './dto/create-thread.dto';
  import { UpdateThreadDto } from './dto/update-thread.dto';
  import { ThreadQueryDto } from './dto/thread-query.dto';
import { SortType } from './enum/sort-type.enum';
import {  ThreadWithDetails } from './types/threads.types';
import { FindOneThreadQueryDto } from './dto/find-thread-query.dto';
import { buildThreadIncludeOptions, formatVotes } from './utils/threads.utils';
  
  @Injectable()
  export class ThreadsService {
    constructor(private prisma: PrismaService) {}
    
  /**
   * Creates a new thread
   * @param userId - ID of the user creating the thread
   * @param createThreadDto - Data for the new thread
   * @returns The created thread with author information and vote counts
   */
    async create(userId: number, createThreadDto: CreateThreadDto) {
      const thread = await this.prisma.thread.create({
        data: {
          ...createThreadDto,
          author_user_id: userId,
        },
        include: {
          author: { select: { id: true, username: true, name: true } },
          category: true,
          _count: { select: { comments: true, votes: true } }, 
          votes: { select: { vote_type: true, voter_user_id: true } },
        },
      });

      return {
        ...thread,
        votes: formatVotes(thread.votes),
      };
    }

  /**
   * Retrieves a paginated list of threads with optional sorting
   * @param query - Query parameters including sort type, page, and limit
   * @returns Paginated list of threads with metadata
   */    
    async findAll({ sort = SortType.LATEST, page = 1, limit = 10 }: ThreadQueryDto) {
      const orderBy = {
        created_at: sort === SortType.LATEST ? 'desc' as const : 'asc' as const,
      };
  
      const [threads, total] = await Promise.all([
        this.prisma.thread.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          include: {
            author: { select: { id: true, username: true, name: true } },
            category: true,
            _count: { select: { comments: true, votes: true } },
            votes: { select: { vote_type: true, voter_user_id: true } }, 
          },
        }),
        this.prisma.thread.count(),
      ]);
  
      return {
        data: threads.map(thread => ({
          ...thread,
          votes: formatVotes(thread.votes), 
        })),
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
    ): Promise<ThreadWithDetails> {
      const {
        includeComments = true,
        commentsPage = 1,
        commentsLimit = 10,
        includeVotes = true
      } = options || {};
  
      const thread = await this.prisma.thread.findUnique({
        where: { thread_id: threadId },
        include: buildThreadIncludeOptions(includeComments, includeVotes, commentsPage, commentsLimit),
      });
  
      if (!thread) {
        throw new NotFoundException('Thread not found');
      }
  
      return this.formatThreadResponse(thread, userId, includeComments, includeVotes);
    }
  
  /**
   * Updates an existing thread
   * @param userId - ID of the user attempting the update
   * @param id - ID of the thread to update
   * @param updateThreadDto - Data to update the thread with
   * @returns The updated thread
   * @throws ForbiddenException if user doesn't own the thread
   */    
    async update(userId: number, id: number, updateThreadDto: UpdateThreadDto) {
      const thread = await this.getThreadById(id);
      if (thread.author_user_id !== userId) {
        throw new ForbiddenException('You can only update your own threads');
      }
    
      const updatedThread = await this.prisma.thread.update({
        where: { thread_id: id },
        data: updateThreadDto,
        include: {
          author: { select: { id: true, username: true, name: true } },
          category: true,
          votes: { select: { vote_type: true, voter_user_id: true } },
        },
      });
    
      return {
        ...updatedThread,
        votes: formatVotes(updatedThread.votes, userId),
      };
    }
  
  /**
   * Deletes a thread
   * @param userId - ID of the user attempting deletion
   * @param id - ID of the thread to delete
   * @returns Success status
   * @throws ForbiddenException if user doesn't own the thread
   */  
    async remove(userId: number, id: number): Promise<{ success: boolean }> {
      const thread = await this.getThreadById(id);
      if (thread.author_user_id !== userId) {
        throw new ForbiddenException('You can only delete your own threads');
      }
    
      await this.prisma.thread.delete({ where: { thread_id: id } });
      return { success: true };
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
   * Formats a thread response with optional comments and votes
   * @param thread - The raw thread data from Prisma
   * @param userId - Optional ID of the requesting user
   * @param includeComments - Whether to include comments
   * @param includeVotes - Whether to format votes
   * @returns Formatted thread response
   * @private
   */
    private formatThreadResponse(
      thread: any, 
      userId?: number,
      includeComments?: boolean,
      includeVotes?: boolean
    ): ThreadWithDetails {
      const baseResponse: ThreadWithDetails = {
        ...thread,
        ...(includeVotes && { 
          votes: formatVotes(thread.votes, userId) 
        }),
      };
  
      if (includeComments) {
        baseResponse.comments = thread.comments.map((comment: any) => ({
          ...comment,
          ...(includeVotes && { 
            votes: formatVotes(comment.votes, userId) 
          }),
        }));
      }
  
      return baseResponse;
    }
    
  }