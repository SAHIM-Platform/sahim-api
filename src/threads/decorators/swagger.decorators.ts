import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SortType } from '../enum/sort-type.enum';

/**
 * Base API documentation decorator for threads controller
 */
export function SwaggerThreads() {
  return applyDecorators(
    ApiTags('Threads'),
    ApiBearerAuth('access-token'),
    ApiHeader({
      name: 'Authorization',
      description: 'Bearer token for authentication',
      required: true,
    }),
  );
}

/**
 * API documentation for thread creation
 */
export function SwaggerCreateThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new thread' }),
    ApiBody({
      description: 'Thread payload',
      schema: {
        example: {
          category_id: 1,
          title: 'My New Thread',
          content: 'Thread content goes here',
          thumbnail_url: null,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Thread created successfully',
      schema: {
        example: {
          message: 'Thread created successfully',
          data: {
            thread_id: 12,
            category_id: 1,
            author_user_id: 2,
            title: 'My New Thread',
            content: 'Thread content goes here',
            thumbnail_url: null,
            created_at: '2025-05-06T12:00:00.000Z',
            author: { id: 2, username: 'jdoe', name: 'Jane Doe' },
            category: {
              category_id: 1,
              name: 'General',
              author_user_id: null,
            },
            _count: { comments: 0, votes: 0 },
            votes: { score: 0, user_vote: null, counts: { up: 0, down: 0 } },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Category not found' }),
  );
}

/**
 * API documentation for listing threads
 */
export function SwaggerGetThreads() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all threads with pagination and filtering' }),
    ApiQuery({
      name: 'sort',
      required: false,
      enum: ['LATEST', 'POPULAR', 'TRENDING'],
      description: 'Sort order',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    ApiQuery({
      name: 'category_id',
      required: false,
      type: Number,
      description: 'Filter by category ID',
    }),
    ApiResponse({
      status: 200,
      description: 'List of threads retrieved successfully',
      schema: {
        example: {
          message: 'Threads retrieved successfully',
          data: [
            {
              thread_id: 1,
              category_id: 1,
              author_user_id: 1,
              title: 'Thread Title',
              content: 'Thread Content',
              thumbnail_url: null,
              created_at: '2025-05-05T08:00:00.000Z',
              author: { id: 1, username: 'alice', name: 'Alice' },
              category: {
                category_id: 1,
                name: 'General',
                author_user_id: null,
              },
              _count: { comments: 2, votes: 3 },
              votes: { score: 1, user_vote: null, counts: { up: 2, down: 1 } },
              bookmarked: false,
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

/**
 * API documentation for retrieving a single thread
 */
export function SwaggerGetThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a thread by ID' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiQuery({
      name: 'includeComments',
      required: false,
      type: Boolean,
      description: 'Include comments',
    }),
    ApiQuery({
      name: 'includeVotes',
      required: false,
      type: Boolean,
      description: 'Include vote info',
    }),
    ApiResponse({
      status: 200,
      description: 'Thread retrieved successfully',
      schema: {
        example: {
          message: 'Thread retrieved successfully',
          data: {
            thread_id: 1,
            category_id: 1,
            author_user_id: 1,
            title: 'Thread Title',
            content: 'Thread Content',
            thumbnail_url: null,
            created_at: '2025-05-05T08:00:00.000Z',
            author: { id: 1, username: 'alice', name: 'Alice' },
            category: { category_id: 1, name: 'General', author_user_id: null },
            votes: { score: 1, user_vote: 'UP', counts: { up: 2, down: 1 } },
            comments: [
              {
                comment_id: 5,
                thread_id: 1,
                author_user_id: 2,
                content: 'Nice thread!',
                created_at: '2025-05-05T09:00:00.000Z',
                author: { id: 2, username: 'bob', name: 'Bob' },
                votes: { score: 0, user_vote: null, counts: { up: 0, down: 0 } },
              },
            ],
            _count: { comments: 1, votes: 3 },
            bookmarked: true,
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' }),
  );
}

/**
 * API documentation for updating a thread
 */
export function SwaggerUpdateThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiBody({
      description: 'Update payload',
      schema: { example: { title: 'Updated Title', content: 'New content' } },
    }),
    ApiResponse({
      status: 200,
      description: 'Thread updated successfully',
      schema: {
        example: {
          message: 'Thread updated successfully',
          data: {
            thread_id: 1,
            category_id: 1,
            author_user_id: 1,
            title: 'Updated Title',
            content: 'New content',
            thumbnail_url: null,
            created_at: '2025-05-05T08:00:00.000Z',
            author: { id: 1, username: 'alice', name: 'Alice' },
            category: { category_id: 1, name: 'General', author_user_id: null },
            _count: { comments: 1, votes: 3 },
            votes: { score: 1, user_vote: null, counts: { up: 2, down: 1 } },
            bookmarked: false,
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Not the thread author' }),
    ApiResponse({ status: 404, description: 'Thread not found' }),
  );
}

/**
 * API documentation for deleting a thread
 */
export function SwaggerRemoveThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiResponse({
      status: 200,
      description: 'Thread deleted successfully',
      schema: {
        example: {
          message: 'Thread deleted successfully',
          data: null,
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Not the thread author' }),
    ApiResponse({ status: 404, description: 'Thread not found' }),
  );
}

/**
 * API documentation for searching threads
 */
export function SwaggerSearchThreads() {
  return applyDecorators(
    ApiOperation({
      summary: 'Search threads',
      description: 'Case-insensitive search with pagination and optional category filter',
    }),
    ApiQuery({ name: 'query', type: String, required: true, description: 'Search text' }),
    ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page' }),
    ApiQuery({
      name: 'category_id',
      type: Number,
      required: false,
      description: 'Filter by category ID',
    }),
    ApiQuery({
      name: 'sort',
      enum: SortType,
      required: false,
      description: 'Sort order (LATEST/OLDEST)',
    }),
    ApiResponse({
      status: 200,
      description: 'Paginated search results',
      schema: {
        example: {
          message: 'Threads retrieved successfully',
          data: [
            {
              thread_id: 3,
              title: 'NestJS question',
              content: 'How do I ...?',
              created_at: '2025-05-05T07:00:00.000Z',
              author: { id: 1, username: 'alice', name: 'Alice' },
              category: { category_id: 2, name: 'Help' },
              _count: { comments: 0, votes: 0 },
              votes: { score: 0, user_vote: null, counts: { up: 0, down: 0 } },
              bookmarked: false,
            },
          ],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1, query: 'nestjs' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

/**
 * API documentation for retrieving all categories
 */
export function SwaggerGetCategories() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all thread categories' }),
    ApiResponse({
      status: 200,
      description: 'List of categories retrieved successfully',
      schema: {
        example: {
          message: 'Categories retrieved successfully',
          data: [
            {
              category_id: 1,
              name: 'General',
            },
          ],
        },
      },
    }),
  );
}

/**
 * API documentation for thread voting
 */
export function SwaggerVoteThread() {
  return applyDecorators(
    ApiOperation({
      summary: 'Vote on a thread',
      description:
        'Upvote/downvote a thread. Re-sending the same vote will remove it (toggle); a different vote replaces the old one.',
    }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiBody({ description: 'Vote payload', schema: { example: { vote_type: 'UP' } } }),
    ApiResponse({
      status: 200,
      description: 'Vote updated successfully',
      schema: {
        example: {
          message: 'Vote updated successfully',
          data: { score: 1, user_vote: 'UP', counts: { up: 1, down: 0 } },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid vote type' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' }),
  );
}

/**
 * API documentation for comment voting
 */
export function SwaggerVoteComment() {
  return applyDecorators(
    ApiOperation({
      summary: 'Vote on a comment',
      description:
        'Upvote/downvote a comment. Re-sending the same vote will remove it (toggle); a different vote replaces the old one.',
    }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiParam({ name: 'commentId', description: 'Comment ID', type: 'number' }),
    ApiBody({ description: 'Vote payload', schema: { example: { vote_type: 'DOWN' } } }),
    ApiResponse({
      status: 200,
      description: 'Vote updated successfully',
      schema: {
        example: {
          message: 'Vote updated successfully',
          data: { score: -1, user_vote: 'DOWN', counts: { up: 0, down: 1 } },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid vote type' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread or comment not found' }),
  );
}

/**
 * API documentation for creating a comment
 */
export function SwaggerCreateComment() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a comment on a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiBody({ description: 'Comment payload', schema: { example: { content: 'Great explanation!' } } }),
    ApiResponse({
      status: 201,
      description: 'Comment created successfully',
      schema: {
        example: {
          message: 'Comment created successfully',
          data: {
            comment_id: 42,
            thread_id: 1,
            author_user_id: 2,
            content: 'Great explanation!',
            created_at: '2025-05-06T12:00:00.000Z',
            author: { id: 2, username: 'jdoe', name: 'Jane Doe' },
            votes: { score: 0, user_vote: null, counts: { up: 0, down: 0 } },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' }),
  );
}

/**
 * API documentation for updating a comment
 */
export function SwaggerUpdateComment() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a comment' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiParam({ name: 'commentId', description: 'Comment ID', type: 'number' }),
    ApiBody({ description: 'Updated comment payload', schema: { example: { content: 'Updated comment content' } } }),
    ApiResponse({
      status: 200,
      description: 'Comment updated successfully',
      schema: {
        example: {
          message: 'Comment updated successfully',
          data: {
            comment_id: 42,
            thread_id: 1,
            author_user_id: 2,
            content: 'Updated comment content',
            created_at: '2025-05-06T12:00:00.000Z',
            author: { id: 2, username: 'jdoe', name: 'Jane Doe' },
            votes: { score: 0, user_vote: null, counts: { up: 0, down: 0 } },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Not the comment author' }),
    ApiResponse({ status: 404, description: 'Thread or comment not found' }),
  );
}

/**
 * API documentation for deleting a comment
 */
export function SwaggerRemoveComment() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a comment' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiParam({ name: 'commentId', description: 'Comment ID', type: 'number' }),
    ApiResponse({
      status: 200,
      description: 'Comment deleted successfully',
      schema: {
        example: {
          message: 'Comment deleted successfully',
          data: null,
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Not the comment author' }),
    ApiResponse({ status: 404, description: 'Thread or comment not found' }),
  );
}

/**
 * API documentation for listing comments
 */
export function SwaggerGetComments() {
  return applyDecorators(
    ApiOperation({ summary: 'Get comments for a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    ApiResponse({
      status: 200,
      description: 'Comments retrieved successfully',
      schema: {
        example: {
          message: 'Comments retrieved successfully',
          data: [
            {
              comment_id: 1,
              thread_id: 1,
              author_user_id: 2,
              content: 'Nice post!',
              created_at: '2025-05-06T12:00:00.000Z',
              author: { id: 2, username: 'jdoe', name: 'Jane Doe' },
              votes: { score: 2, user_vote: 'UP', counts: { up: 2, down: 0 } },
            },
          ],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' }),
  );
}

/**
 * API documentation for bookmarking a thread
 */
export function SwaggerBookmarkThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Bookmark a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiResponse({
      status: 201,
      description: 'Thread bookmarked successfully',
      schema: {
        example: {
          message: 'Thread bookmarked successfully',
          data: null,
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' }),
    ApiResponse({ status: 409, description: 'Conflict - Already bookmarked' }),
  );
}

/**
 * API documentation for unbookmarking a thread
 */
export function SwaggerUnbookmarkThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Unbookmark a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiResponse({
      status: 200,
      description: 'Thread unbookmarked successfully',
      schema: {
        example: {
          message: 'Thread unbookmarked successfully',
          data: null,
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not bookmarked' }),
  );
}
