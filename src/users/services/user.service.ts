import { ForbiddenException, Injectable} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { isUserDeleted } from '@/threads/utils/threads.utils';
import * as bcrypt from 'bcryptjs';
import { UpdateMeDto } from '../dto/update-me.dto';
import { UserRole } from '@prisma/client';
import { DeletedUserException } from '../exceptions/deleted-user.exception';
import { UserNotFoundException } from '@/common/exceptions/user-not-found.exception';
import { InvalidCredentialsException } from '@/common/exceptions/invalid-credentials.exception';
import { ApiResponse } from '@/common/interfaces/api-response.interface';
import { UsernameTakenException } from '@/auth/exceptions/username-taken.exception';
import { SuperAdminModificationForbiddenException } from '../exceptions/super-admin-modification-forbidden.exception';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Finds a user by their email address.
   * @param email - The email address to search for.
   * @returns The user if found, otherwise null.
   */
  async findUserByEmail(email: string) {
      return await this.prisma.user.findUnique({
        where: { email },
        include: { student: true }
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
  async deleteUserAccount(userId: number, password: string): Promise<ApiResponse<Record<string, any>>> {
    // First check if user exists and get their role
    const user = await this.findUserById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Prevent deletion of super admin accounts
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new SuperAdminModificationForbiddenException();
    }

    // Validate the password
    const validPassword = await this.validatePassword(userId, password);
    if (!validPassword) {
      throw new InvalidCredentialsException();
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

    return {
        message: 'User account deleted successfully',
        data: updatedUser,
    };
  }

  async validatePassword(userId: number, password: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user || isUserDeleted(user)) {
      return false;
    }

    return bcrypt.compare(password, user.password!);
  }

  async updateMe(userId: number, dto: UpdateMeDto): Promise<ApiResponse<Record<string, any>>> {
    const { name, username, photoPath } = dto;

    const user = await this.findUserById(userId);

    // Check if user is deleted
    if (!user || isUserDeleted(user)) {
      throw new DeletedUserException();
    }

    // Prevent modification of super admin accounts
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new SuperAdminModificationForbiddenException();
    }

    // Check if username is taken (if provided)
    if (username) {
      const existing = await this.findUserByUsername(username);
      if (existing && existing.id !== userId) {
        throw new UsernameTakenException();
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

    return {
        message: "",
        data: this.sanitizeUser(updatedUser)
    }
  }

  async findUserByUsernameOrAcademicNumber(identifier: string, role?: UserRole) {
    if (role === UserRole.STUDENT || !role) {
      const student = await this.prisma.student.findUnique({
        where: { academicNumber: identifier },
        include: { user: { include: { student: true } } },
      });
      if (student) {
        return student.user;
      }
    }

    return this.prisma.user.findUnique({
      where: { username: identifier },
      include: { student: true },
    });
  }

}
