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
import { ThreadWithDetails } from './types/threads.types';
import { FindOneThreadQueryDto } from './dto/find-thread-query.dto';
import { buildThreadIncludeOptions, formatVotes } from './utils/threads.utils';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { VoteDto } from './dto/vote.dto';
import { CategoryNotFoundException } from '@/admins/exceptions/category-not-found.exception';
import { Prisma } from '@prisma/client';
import { SearchThreadsDto } from './dto/search-threads.dto';

@Injectable()
export class ThreadsService {
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
  ) {
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
          author: { select: { id: true, username: true, name: true } },
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
  
    return {
      data: threads.map(({ bookmarks, ...thread }) => ({
        ...thread,
        votes: formatVotes(thread.votes, userId),
        bookmarked: !!(bookmarks?.some(b => b.user_id === userId)),
      })),
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
  async create(userId: number, createThreadDto: CreateThreadDto) {
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
  async findAll({ sort = SortType.LATEST, page = 1, limit = 10 , category_id}: ThreadQueryDto, userId?: number) {
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
          author: { select: { id: true, username: true, name: true } },
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

    return {
      data: threads.map(({ bookmarks, ...thread }) => ({
        ...thread,
        votes: formatVotes(thread.votes, userId),
        bookmarked: !!(bookmarks?.some(b => b.user_id === userId)),
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
   * Creates a new comment in a thread
   * @param userId - ID of the user creating the comment
   * @param threadId - ID of the thread to comment on
   * @param createCommentDto - Data for the new comment
   * @returns The created comment with author information and vote counts
   */
  async createComment(
    userId: number,
    threadId: number,
    createCommentDto: CreateCommentDto,
  ) {
    await this.ensureThreadExists(threadId);

    const comment = await this.prisma.threadComment.create({
      data: {
        ...createCommentDto,
        thread_id: threadId,
        author_user_id: userId,
      },
      include: {
        author: { select: { id: true, username: true, name: true } },
        votes: { select: { vote_type: true, voter_user_id: true } },
      },
    });

    return ({
      ...comment,
      votes: formatVotes(comment.votes, userId),
    });
  }

  /**
   * Updates an existing comment in a thread
   * @param userId - ID of the user attempting the update
   * @param threadId - ID of the thread containing the comment
   * @param commentId - ID of the comment to update
   * @param updateCommentDto - Data to update the comment with
   * @returns The updated comment with formatted votes
   * @throws NotFoundException if comment doesn't exist or doesn't belong to the user
   */
  async updateComment(
    userId: number,
    threadId: number,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ) {
    await this.ensureThreadExists(threadId); // Ensure the thread exists
    // Verify comment exists and belongs to user
    const comment = await this.prisma.threadComment.findUnique({
      where: {
        comment_id: commentId,
        thread_id: threadId,
        author_user_id: userId,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or unauthorized');
    }

    const updatedComment = await this.prisma.threadComment.update({
      where: { comment_id: commentId },
      data: updateCommentDto,
      include: {
        author: { select: { id: true, username: true, name: true } },
        votes: { select: { vote_type: true, voter_user_id: true } },
      },
    });

    return ({
      ...updatedComment,
      votes: formatVotes(updatedComment.votes, userId),
    });
  }


  /**
   * Deletes a comment from a thread
   * @param userId - ID of the user attempting the deletion
   * @param threadId - ID of the thread containing the comment
   * @param commentId - ID of the comment to delete
   * @returns Success status
   * @throws NotFoundException if comment doesn't exist or doesn't belong to the user
   */
  async deleteComment(
    userId: number,
    threadId: number,
    commentId: number,
  ) {
    await this.ensureThreadExists(threadId); // Ensure the thread exists

    // Verify comment exists and belongs to user
    const comment = await this.prisma.threadComment.findFirst({
      where: {
        comment_id: commentId,
        thread_id: threadId,
        author_user_id: userId,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or unauthorized');
    }

    await this.prisma.threadComment.delete({ where: { comment_id: commentId } });
    return { success: true };
  }


  /**
   * Retrieves a paginated list of comments for a specific thread
   * @param threadId - ID of the thread to retrieve comments for
   * @param query - Query parameters including page, limit, and sort type
   * @param userId - Optional ID of the requesting user for vote status
   * @returns Paginated list of comments with metadata
   * @throws NotFoundException if thread doesn't exist
   */
  async getThreadComments(
    threadId: number,
    query: CommentQueryDto,
    userId?: number,
  ) {
    await this.ensureThreadExists(threadId);
    const { page = 1, limit = 10, sort = SortType.LATEST } = query;

    const orderBy = {
      created_at: sort === SortType.OLDEST ? 'asc' as const : 'desc' as const,
    };

    const [comments, total] = await Promise.all([
      this.prisma.threadComment.findMany({
        where: { thread_id: threadId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, username: true, name: true } },
          votes: { select: { vote_type: true, voter_user_id: true } },
        },
      }),
      this.prisma.threadComment.count({
        where: { thread_id: threadId },
      }),
    ]);

    const formattedComments = comments.map(comment => ({
      ...comment,
      votes: formatVotes(comment.votes, userId),
    }));

    return {
      data: formattedComments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
 * Votes on a thread (upvote/downvote)
 * @param userId - ID of the user casting the vote
 * @param threadId - ID of the thread being voted on
 * @param voteDto - Contains the vote type (upvote/downvote)
 * @returns Updated vote counts for the thread
 * @throws NotFoundException if the thread does not exist
 */
  async voteThread(userId: number, threadId: number, voteDto: VoteDto) {
    await this.ensureThreadExists(threadId);

    // First, check if the user has already voted on this thread
    const existingVote = await this.prisma.threadVote.findUnique({
      where: {
        thread_id_voter_user_id: {
          thread_id: threadId,
          voter_user_id: userId,
        },
      },
    });

    if (existingVote) {
      // If the same vote type is sent again, remove the vote (toggle)
      if (existingVote.vote_type === voteDto.vote_type) {
        await this.prisma.threadVote.delete({
          where: {
            thread_id_voter_user_id: {
              thread_id: threadId,
              voter_user_id: userId,
            },
          },
        });
      } else {
        // If a different vote type is sent, update the vote
        await this.prisma.threadVote.update({
          where: {
            thread_id_voter_user_id: {
              thread_id: threadId,
              voter_user_id: userId,
            },
          },
          data: {
            vote_type: voteDto.vote_type,
          },
        });
      }
    } else {
      // If no vote exists, create a new one
      await this.prisma.threadVote.create({
        data: {
          thread_id: threadId,
          voter_user_id: userId,
          vote_type: voteDto.vote_type,
        },
      });
    }

    const updatedVotes = await this.prisma.threadVote.findMany({
      where: { thread_id: threadId },
      select: { vote_type: true, voter_user_id: true },
    });

    return {
      success: true,
      updatedVotes: formatVotes(updatedVotes, userId),
    };
  }

  /**
   * Votes on a comment (upvote/downvote)
   * @param userId - ID of the user casting the vote
   * @param threadId - ID of the thread containing the comment
   * @param commentId - ID of the comment being voted on
   * @param voteDto - Contains the vote type (upvote/downvote)
   * @returns Updated vote counts for the comment
   * @throws NotFoundException if the comment does not exist
   */
  async voteComment(
    userId: number,
    threadId: number,
    commentId: number,
    voteDto: VoteDto,
  ) {
    const comment = await this.prisma.threadComment.findUnique({
      where: { comment_id: commentId, thread_id: threadId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    // First, check if the user has already voted on this comment
    const existingVote = await this.prisma.commentVote.findUnique({
      where: {
        comment_id_voter_user_id: {
          comment_id: commentId,
          voter_user_id: userId,
        },
      },
    });

    if (existingVote) {
      // If the same vote type is sent again, remove the vote (toggle)
      if (existingVote.vote_type === voteDto.vote_type) {
        await this.prisma.commentVote.delete({
          where: {
            comment_id_voter_user_id: {
              comment_id: commentId,
              voter_user_id: userId,
            },
          },
        });
      } else {
        // If a different vote type is sent, update the vote
        await this.prisma.commentVote.update({
          where: {
            comment_id_voter_user_id: {
              comment_id: commentId,
              voter_user_id: userId,
            },
          },
          data: {
            vote_type: voteDto.vote_type,
          },
        });
      }
    } else {
      // If no vote exists, create a new one
      await this.prisma.commentVote.create({
        data: {
          comment_id: commentId,
          voter_user_id: userId,
          vote_type: voteDto.vote_type,
        },
      });
    }

    const updatedVotes = await this.prisma.commentVote.findMany({
      where: { comment_id: commentId },
      select: { vote_type: true, voter_user_id: true },
    });

    return {
      success: true,
      updatedVotes: formatVotes(updatedVotes, userId),
    };
  }


  /**
   * Bookmarks a specific thread for a user.
   * 
   * @param {number} userId - The ID of the user who is bookmarking the thread.
   * @param {number} threadId - The ID of the thread to be bookmarked.
   * @returns {Promise<{ message: string, success: boolean }>} Success message and status.
   * @throws {ForbiddenException} If the thread is already bookmarked by the user.
   */
  async bookmarkThread(userId: number, threadId: number) {
    await this.ensureThreadExists(threadId);

    const existingBookmark = await this.prisma.bookmarkedThread.findUnique({
      where: {
        user_id_thread_id: {
          user_id: userId,
          thread_id: threadId,
        },
      },
    });

    if (existingBookmark) {
      throw new ForbiddenException({
        message: 'Thread already bookmarked',
        error: 'Forbidden',
        statusCode: 403,
      });
    }

    await this.prisma.bookmarkedThread.create({
      data: {
        user_id: userId,
        thread_id: threadId,
      },
    });

    return {
      message: 'Thread bookmarked successfully',
      success: true,
    };
  }

  /**
   * Removes a bookmark for a specific thread for the user.
   * 
   * @param {number} userId - The ID of the user who is unbookmarking the thread.
   * @param {number} threadId - The ID of the thread to be removed from bookmarks.
   * @returns {Promise<{ message: string, success: boolean }>} Success message and status.
   * @throws {ForbiddenException} If the thread is not bookmarked by the user.
   */
  async unbookmarkThread(userId: number, threadId: number) {
    await this.ensureThreadExists(threadId);

    const bookmarkedThread = await this.prisma.bookmarkedThread.findUnique({
      where: {
        user_id_thread_id: {
          user_id: userId,
          thread_id: threadId,
        },
      },
    });

    if (!bookmarkedThread) {
      throw new ForbiddenException({
        message: 'Thread is not bookmarked',
        error: 'Forbidden',
        statusCode: 403,
      });
    }

    await this.prisma.bookmarkedThread.delete({
      where: {
        user_id_thread_id: {
          user_id: userId,
          thread_id: threadId,
        },
      },
    });

    return {
      message: 'Thread unbookmarked successfully',
      success: true
    };
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
    const { bookmarks, ...threadWithoutBookmarks } = thread;

    const baseResponse: ThreadWithDetails = {
      ...threadWithoutBookmarks,
      ...(includeVotes && {
        votes: formatVotes(thread.votes, userId)
      }),
      bookmarked: !!(thread.bookmarks?.some((b: any) => b.user_id === userId)),
    };

    if (includeComments) {
      baseResponse.comments = thread.comments
      .sort((a: any, b: any) => b.created_at.getTime() - a.created_at.getTime())
      .map((comment: any) => ({
        ...comment,
        ...(includeVotes && {
          votes: formatVotes(comment.votes, userId)
        }),
      }));



    }

    return baseResponse;
  }

  /**
   * Verifies if the thread exists
   * @param threadId - ID of the thread to check
   * @throws NotFoundException if thread doesn't exist
   * @private
   */
  private async ensureThreadExists(threadId: number) {
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
  async getAllCategories() {
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
      data: categories,
    };
  }
}