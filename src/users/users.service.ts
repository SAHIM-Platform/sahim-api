import { SignupAuthDto } from '@/auth/dto/signup-auth.dto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ThreadsService } from '@/threads/threads.service';
import { formatVotes, isUserDeleted } from '@/threads/utils/threads.utils';
import { BookmarksQueryDto } from './dto/bookmarks-query.dto';
import { SortType } from '@/threads/enum/sort-type.enum';
import * as bcrypt from 'bcryptjs';
import { UpdateMeDto } from './dto/update-me.dto';
import { UserRole } from '@prisma/client';
import { DeletedUserException } from './exceptions/deleted-user.exception';

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
        OR: [
          { email },
          { username }
        ],
        AND: {
          isDeleted: false
        }
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
      where: { 
        id: userId,
        isDeleted: false 
      },
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
   * Retrieves the details of the currently authenticated user,
   * including student-specific fields if the user is a student.
   * 
   * @param userId - The ID of the user to fetch details for.
   * @returns The user details, including role-specific fields.
   */
  async getUserDetails(userId: number) {
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true, 
      },
    });

    if (!userData) {
      throw new NotFoundException('User not found');
    }

    const { id, name, username, email, role, student, photoPath } = userData;

    if (role === UserRole.STUDENT && student) {
      return { id, name, username, email, role, photoPath, academicNumber: student.academicNumber, department: student.department, level: student.studyLevel };
    }

    // Return only general user info for non-students
    return { id, name, username, email, role, photoPath };
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

  /**
   * Soft deletes a user account after password validation.
   * This will:
   * 1. Permanently delete all user's bookmarks
   * 2. Set user as deleted and remove sensitive information
   * 3. Update username to a deleted user format
   * 4. If user is a student, also delete their student record
   * 
   * @param userId - The ID of the user to delete
   * @param password - Current password for verification
   * @throws UnauthorizedException if password is incorrect
   */
  async deleteUserAccount(userId: number, password: string) {
    // First check if user exists and get their role
    const user = await this.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Prevent deletion of super admin accounts
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin accounts cannot be deleted');
    }

    // Validate the password
    const validPassword = await this.validatePassword(userId, password);
    if (!validPassword) {
      throw new UnauthorizedException('Incorrect password');
    }

    // First permanently delete all bookmarks
    await this.prisma.bookmarkedThread.deleteMany({
      where: { user_id: userId }
    });

    // Then soft delete the user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        email: { set: null },
        password: { set: null },
        name: { set: null },
        username: `deleted_user_${userId}`,
        isActive: false
      }
    });

    // If user is a student, delete their student record
    if (updatedUser.role === UserRole.STUDENT) {
      await this.prisma.student.delete({
        where: { userId }
      });
    }

    return updatedUser;
  }

  async validatePassword(userId: number, password: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user || isUserDeleted(user)) {
      return false;
    }

    return bcrypt.compare(password, user.password!); 
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    const { name, username, photoPath } = dto;

    const user = await this.findUserById(userId);

    // Check if user is deleted
    if (!user || isUserDeleted(user)) {
      throw new DeletedUserException();
    }

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
        photoPath,
      },
    });
  
    return this.sanitizeUser(updatedUser);
  }
  
  /**
   * Gets the default photo path based on user role
   * @param role - The user's role
   * @returns {string} The default photo path for the role
   */
  public getDefaultPhotoPath(role: UserRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return '/assets/avatars/defaults/super-admin.webp';
      case UserRole.ADMIN:
        return '/assets/avatars/defaults/admin.webp';
      case UserRole.STUDENT:
      default:
        return '/assets/avatars/defaults/user.webp';
    }
  }
}
