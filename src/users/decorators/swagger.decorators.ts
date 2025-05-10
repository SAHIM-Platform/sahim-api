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
          message: 'Bookmarks retrieved successfully',
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
    ApiResponse({ 
      status: 200, 
      description: 'No bookmarks found',
      schema: {
        example: {
          message: 'No bookmarks found',
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
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
          message: 'User details retrieved successfully',
          data: {
            id: 1,
            name: 'User Name',
            username: 'username',
            email: 'user@example.com',
            role: 'STUDENT',
            authMethod: 'EMAIL',
            photoPath: '/path/to/photo.jpg',
            academicNumber: '123456789',
            department: 'Computer Science',
            level: 2
          }
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'User not found' })
  );
}

export function SwaggerDeleteMe() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete current user account' }),
    ApiBody({ schema: { example: { password: 'currentPassword123' } } }),
    ApiResponse({ 
      status: 200, 
      description: 'User deleted successfully',
      schema: {
        example: {
          message: 'User account deleted successfully',
          data: {
            id: 1,
            username: 'deleted_user_1',
            isDeleted: true,
            deletedAt: '2024-04-09T12:00:00Z'
          }
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Cannot delete super admin account' })
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
          message: 'Profile updated successfully',
          data: {
            id: 1,
            name: 'Updated Name',
            username: 'updatedUsername',
            email: 'user@example.com',
            role: 'STUDENT',
            photoPath: '/updated/path.jpg'
          }
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Username is already taken' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function SwaggerGetUserThreads() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user threads', description: 'Retrieves paginated list of threads created by the current user with optional search and filtering' }),
    ApiQuery({ name: 'sort', required: false, enum: SortType, description: 'Sort order for threads (LATEST or OLDEST)', example: SortType.LATEST }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination', example: 1, minimum: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (max 100)', example: 10, minimum: 1, maximum: 100 }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Search query to filter threads by title or content' }),
    ApiQuery({ name: 'category_id', required: false, type: Number, description: 'Category ID to filter threads' }),
    ApiResponse({ 
      status: 200, 
      description: 'List of user threads retrieved successfully', 
      schema: { 
        example: {
          message: 'Threads retrieved successfully',
          data: [{
            thread_id: 1,
            category_id: 1,
            author_user_id: 1,
            title: 'My Thread Title',
            content: 'This is my thread content',
            thumbnail_url: null,
            created_at: '2023-01-01T00:00:00.000Z',
            author: { id: 1, username: 'myusername', name: 'My Name', photoPath: '/path/to/photo.jpg' },
            category: { category_id: 1, name: 'General' },
            _count: { comments: 5, votes: 10 },
            votes: { score: 8, user_vote: 'UP', counts: { up: 9, down: 1 } },
            bookmarked: false
          }],
          meta: { 
            total: 15, 
            page: 1, 
            limit: 10, 
            totalPages: 2, 
            search: 'thread', 
            category_id: 1 
          }
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - valid access token required' }),
    ApiResponse({ status: 403, description: 'Forbidden - user must be approved student' })
  );
}

export function SwaggerGetUserPublicProfile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a public user profile by username',
      description: 'Returns user public info and optionally their threads with pagination, filtering, and sorting.'
    }),
    ApiQuery({ name: 'includeThreads', required: false, type: Boolean, description: 'Whether to include user threads in the response', example: true }),
    ApiQuery({ name: 'sort', required: false, enum: SortType, description: 'Sort order for threads', example: SortType.LATEST }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for thread pagination', example: 1, minimum: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of threads per page', example: 10, minimum: 1, maximum: 50 }),
    ApiQuery({ name: 'category_id', required: false, type: Number, description: 'Filter threads by category ID', example: 3, minimum: 1 }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Search threads by title or content', example: 'help with NestJS' }),
    ApiResponse({
      status: 200,
      description: 'User public profile retrieved successfully',
      schema: {
        example: {
          message: 'User public profile retrieved successfully',
          data: {
            id: 1,
            username: 'johndoe',
            name: 'John Doe',
            photoPath: '/avatars/john.jpg',
            role: 'STUDENT',
            department: 'Computer Science',
            level: 3,
            threads: [
              {
                thread_id: 101,
                title: 'Interesting Topic',
                content: 'This is the thread content...',
                created_at: '2025-05-01T10:00:00Z',
                category: { category_id: 2, name: 'Tech' },
                _count: { comments: 3, votes: 12 }
              }
            ],
            meta: { total: 5, page: 1, limit: 10, totalPages: 1 }
          }
        }
      }
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
    ApiResponse({ status: 400, description: 'Invalid query parameters' })
  );
}
