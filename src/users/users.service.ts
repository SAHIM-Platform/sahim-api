import { SignupAuthDto } from '@/auth/dto/signup-auth.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
   * Retrieves all bookmarks for a specific user.
   * 
   * @param {number} userId - The ID of the user whose bookmarks are to be retrieved.
   * @returns {Promise<Array>} A list of bookmarked threads with additional information about the thread, including the author, category, and counts for comments and votes.
   */
  async getUserBookmarks(userId: number) {
    return this.prisma.bookmarkedThread.findMany({
      where: { user_id: userId },
      include: {
        thread: {
          include: {
            author: {
              select: { id: true, username: true, name: true }
            },
            category: {
              select: { category_id: true, name: true }
            },
            _count: {
              select: { comments: true, votes: true }
            }
          }
        }
      },
      orderBy: {
        thread: {
          created_at: 'desc', 
        }
      }
    });
  }

}
