// src/user/services/user-details.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UserNotFoundException } from '@/common/exceptions/user-not-found.exception';
import { UserRole } from '@prisma/client';
import { UserDetailsData } from '../inerfaces/user-details-data.interface';
import { ApiResponse } from '@/common/interfaces/api-response.interface';


@Injectable()
export class UserDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the details of the currently authenticated user,
   * including student-specific fields if the user is a student.
   * 
   * @param userId - The ID of the user to fetch details for.
   * @returns The user details, including role-specific fields.
   */
  async getUserDetails(userId: number): Promise<ApiResponse<UserDetailsData>> {
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
      },
    });

    if (!userData) {
      throw new UserNotFoundException();
    }

    const { id, name, username, email, role, student, photoPath, authMethod } = userData;

    if (role === UserRole.STUDENT && student) {
      return { 
        message: 'User details retrieved successfully',
        data: {
          id, 
          name, 
          username, 
          email: email || null, 
          role, 
          authMethod,
          photoPath, 
          academicNumber: student.academicNumber, 
          department: student.department, 
          level: student.studyLevel 
        }
      };
    }

    // Return only general user info for non-students
    return {
      message: 'User details retrieved successfully',
      data: {
        id, 
        name, 
        username, 
        email: email || null, 
        role, 
        authMethod,
        photoPath
      } 
    };
  }

  /**
   * Gets the default photo path based on user role
   * @param role - The user's role
   * @returns {string} The default photo path for the role
   */
  public getDefaultPhotoPath(role: UserRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return '/public/avatars/defaults/super-admin.webp';
      case UserRole.ADMIN:
        return '/public/avatars/defaults/admin.webp';
      case UserRole.STUDENT:
      default:
        return '/public/avatars/defaults/user.webp';
    }
  }
}
