import { SignupAuthDto } from '@/auth/dto/signup-auth.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ThreadsService } from '@/threads/threads.service';
import { formatVotes } from '@/threads/utils/threads.utils';
import { BookmarksQueryDto } from './dto/bookmarks-query.dto';
import { SortType } from '@/threads/enum/sort-type.enum';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threadsService: ThreadsService,
  ) {}

  /**
   * Finds a user by their email address.
   * @param email - The email address to search for.
   * @returns The user if found, otherwise null.
   */
  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username }
    })
  }

  /**
   * Finds a user by their email address or username.
   * @param email - The email address to search for.
   * @param username - The username to search for.
   * @returns The user if found, otherwise null.
   */
  async findUserByEmailOrUsername(email: string, username: string) {
    return await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
  }

  /**
   * Finds a user by their ID.
   * @param userId - The ID of the user to find.
   * @returns The user if found, otherwise null.
   */
  async findUserById(userId: number) {
    return await this.prisma.user.findFirst({
      where: { id: userId },
    });
  }

  /**
   * Removes sensitive information from a user object.
   * @param user - The user object to sanitize.
   * @returns A new object with sensitive fields removed.
   */
  sanitizeUser(user: any): Omit<any, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Retrieves all bookmarks for a specific user with pagination.
   * 
   * @param {number} userId - The ID of the user whose bookmarks are to be retrieved.
   * @param {BookmarksQueryDto} query - Query parameters for pagination and sorting.
   * @returns {Promise<Object>} A paginated list of bookmarked threads with the same structure as GET /threads.
   */
  async getUserBookmarks(userId: number, query: BookmarksQueryDto = {}) {
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
        author: { select: { id: true, username: true, name: true } },
        category: true,
        _count: { select: { comments: true, votes: true } },
        votes: { select: { vote_type: true, voter_user_id: true } },
      },
    });

    // Format the response to match ThreadsService.findAll()
    return {
      data: threads.map(thread => ({
        ...thread,
        votes: formatVotes(thread.votes, userId),
        bookmarked: true, // All threads in this response are bookmarked
      })),
      meta: { 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
      },
    };
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    const { name, username } = dto;
  
    // Check if username is taken (if provided)
    if (username) {
      const existing = await this.findUserByUsername(username);
      if (existing) {
        throw new BadRequestException('Username is already taken');
      }
    }
  
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username,
      },
    });
  
    return this.sanitizeUser(updatedUser);
  }
}
