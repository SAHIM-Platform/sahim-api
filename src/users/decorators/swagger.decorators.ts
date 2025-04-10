import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse
} from '@nestjs/swagger';

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
    ApiResponse({
      status: 200,
      description: 'List of bookmarked threads retrieved successfully',
      schema: {
        example: [
          {
            user_id: 1,
            thread_id: 1,
            thread: {
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
                comments: 0,
                votes: 0
              }
            }
          }
        ]
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
          role: 'STUDENT'
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'User not found' })
  );
}
