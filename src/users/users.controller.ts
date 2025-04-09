import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApprovedStudentGuard } from '@/auth/guards/approved-student.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'Authorization', description: 'Bearer token for authentication', required: true })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('test-approved-student')
  @UseGuards(ApprovedStudentGuard)
  @ApiOperation({ summary: 'Test endpoint for approved students' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully verified as an approved student or admin',
    schema: {
      example: {
        message: 'You are an approved student or an admin 123!'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  testApprovedStudent(@Req() req) {
    return { message: `You are an approved student or an admin ${req.user.sub}!` };
  }

  @Get('me/bookmarks')
  @ApiOperation({ summary: 'Get current user bookmarks' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of bookmarked threads retrieved successfully',
    schema: {
      example: [{
        "user_id": 1,
        "thread_id": 1,
        "thread": {
          "thread_id": 1,
          "category_id": 1,
          "author_user_id": 1,
          "title": "Thread Title",
          "content": "Thread content",
          "thumbnail_url": null,
          "created_at": "2023-01-01T00:00:00.000Z",
          "author": {
            "id": 1,
            "username": "username",
            "name": "User Name"
          },
          "category": {
            "category_id": 1,
            "name": "Category Name"
          },
          "_count": {
            "comments": 0,
            "votes": 0
          }
        }
      }]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUserBookmarks(@GetUser('sub') userId) {
    return this.usersService.getUserBookmarks(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile information retrieved successfully',
    schema: {
      example: {
        id: 1,
        name: 'User Name',
        username: 'username',
        email: 'user@example.com',
        role: 'STUDENT',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMe(@GetUser('sub') userId: number) {
    const userData = await this.usersService.findUserById(userId);

    if (!userData) {
      throw new NotFoundException('User not found');
    }

    const { id, name, username, email, role } = userData;
    return { id, name, username, email, role };
  }
}
