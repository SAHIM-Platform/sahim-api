// src/user/services/user-details.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UserNotFoundException } from '@/common/exceptions/user-not-found.exception';
import { UserRole } from '@prisma/client';
import { UserDetailsData } from '../inerfaces/user-details-data.interface';
import { ApiResponse } from '@/common/interfaces/api-response.interface';
import { UserContentService } from './user-content.service';
import { PublicProfileResponse } from '../inerfaces/public-profile-response.interface';
import {  ProfileQueryDto } from '../dto/profile-query.dto';


@Injectable()
export class UserDetailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContentService: UserContentService,
  ) {}

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
   * Fetches a user’s public profile by username.
   * If includeThreads=true, includes a paginated, filterable list of their threads.
   */
  async getPublicProfile(username: string, {includeThreads, ...threadQuery}: ProfileQueryDto): Promise<PublicProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { student: { select: { department: true } } },
    });
    if (!user || user.isDeleted) {
      throw new UserNotFoundException();
    }

    const profileData: PublicProfileResponse[ 'data' ] = {
      id:         user.id,
      name:       user.name!,
      username:   user.username,
      role:       user.role,
      department: user.student?.department,
    };

    if (includeThreads) {
      const { data: threads, meta: threadsMeta } = await this.userContentService.getUserThreads(user.id, threadQuery);

      return {
        message: 'Profile retrieved successfully',
        data: {
          ...profileData,
          threads,
          threadsMeta,
        },
      };
    }

    return {
      message: 'Profile retrieved successfully',
      data: profileData,
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
