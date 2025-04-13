import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { SortType } from '@/threads/enum/sort-type.enum';
import { UpdateMeDto } from '../dto/update-me.dto';

export function SwaggerUsersController() {
  return applyDecorators(
    ApiTags('Users'),
    ApiBearerAuth('access-token'),
    ApiHeader({
      name: 'Authorization',
      description: 'Bearer token for authentication',
      required: true
    })
  );
}

export function SwaggerTestApprovedStudent() {
  return applyDecorators(
    ApiOperation({ summary: 'Test endpoint for approved students' }),
    ApiResponse({
      status: 200,
      description: 'Successfully verified as an approved student or admin',
      schema: {
        example: {
          message: 'You are an approved student or an admin 123!'
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' })
  );
}

export function SwaggerGetUserBookmarks() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user bookmarks' }),
    ApiQuery({
      name: 'sort',
      required: false,
      enum: SortType,
      description: 'Sort order for bookmarked threads',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number for pagination',
      minimum: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
      minimum: 1,
      maximum: 50,
    }),
    ApiResponse({
      status: 200,
      description: 'List of bookmarked threads retrieved successfully',
      schema: {
        example: {
          data: [
            {
              thread_id: 1,
              category_id: 1,
              author_user_id: 1,
              title: 'Thread Title',
              content: 'Thread content',
              thumbnail_url: null,
              created_at: '2023-01-01T00:00:00.000Z',
              author: {
                id: 1,
                username: 'username',
                name: 'User Name'
              },
              category: {
                category_id: 1,
                name: 'Category Name'
              },
              _count: {
                comments: 5,
                votes: 10
              },
              votes: {
                score: 8,
                user_vote: 'UP',
                counts: {
                  up: 9,
                  down: 1
                }
              },
              bookmarked: true
            }
          ],
          meta: {
            total: 15,
            page: 1,
            limit: 10,
            totalPages: 2
          }
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' })
  );
}

export function SwaggerGetMe() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user profile' }),
    ApiResponse({
      status: 200,
      description: 'User profile information retrieved successfully',
      schema: {
        example: {
          id: 1,
          name: 'User Name',
          username: 'username',
          email: 'user@example.com',
          role: 'STUDENT',
          academicNumber: '123456789',   
          department: 'Computer Science', 
          level: 2                        
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'User not found' })
  );
}

export function SwaggerUpdateMe() {
  return applyDecorators(
    ApiOperation({ summary: 'Update current user profile (name and username only)' }),
    ApiBody({ type: UpdateMeDto }),
    ApiResponse({
      status: 200,
      description: 'User updated successfully',
      schema: {
        example: {
          id: 1,
          name: 'Updated Name',
          username: 'updatedUsername',
          email: 'user@example.com',
          role: 'STUDENT',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Username is already taken' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
