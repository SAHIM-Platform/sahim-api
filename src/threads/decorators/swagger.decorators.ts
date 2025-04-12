import { applyDecorators } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiHeader, 
  ApiParam, 
  ApiQuery, 
  ApiBody 
} from '@nestjs/swagger';
import { SortType } from '../enum/sort-type.enum';

/**
 * Base API documentation decorator for threads controller
 */
export function SwaggerThreads() {
  return applyDecorators(
    ApiTags('Threads'),
    ApiBearerAuth('access-token'),
    ApiHeader({ name: 'Authorization', description: 'Bearer token for authentication', required: true })
  );
}

/**
 * API documentation for thread creation
 */
export function SwaggerCreateThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new thread' }),
    ApiResponse({ 
      status: 201, 
      description: 'Thread created successfully',
      schema: {
        example: {
          thread_id: 12,
          category_id: 1,
          author_user_id: 2,
          title: "hi there",
          content: "some content",
          thumbnail_url: null,
          created_at: "2025-04-09T20:30:41.622Z",
          author: {
            id: 2,
            username: "username",
            name: "User Name"
          },
          category: {
            category_id: 1,
            name: "Category Name",
            author_user_id: null
          },
          _count: {
            comments: 0,
            votes: 0
          },
          votes: {
            score: 0,
            user_vote: null,
            counts: {
              up: 0,
              down: 0
            }
          }
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Category not found' })
  );
}

/**
 * API documentation for thread retrieval
 */
export function SwaggerGetThreads() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all threads with pagination and filtering' }),
    ApiQuery({ name: 'sort', required: false, enum: ['LATEST', 'POPULAR', 'TRENDING'], description: 'Sort order for threads' }),
    ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number for pagination' }),
    ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of items per page' }),
    ApiQuery({ name: 'category_id', required: false, type: 'number', description: 'Filter threads by category ID' }),
    ApiResponse({ 
      status: 200, 
      description: 'List of threads retrieved successfully',
      schema: {
        example: {
          data: [{
            thread_id: 1,
            category_id: 1,
            author_user_id: 1,
            title: "Thread Title",
            content: "Thread Content",
            thumbnail_url: null,
            created_at: "2025-04-08T03:10:41.929Z",
            author: {
              id: 1,
              username: "username",
              name: "User Name"
            },
            category: {
              category_id: 1,
              name: "Category Name",
              author_user_id: null
            },
            _count: {
              comments: 1,
              votes: 0
            },
            votes: {
              score: 0,
              user_vote: null,
              counts: {
                up: 0,
                down: 0
              }
            },
            bookmarked: false
          }],
          meta: {
            total: 100,
            page: 1,
            limit: 10,
            totalPages: 10
          }
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' })
  );
}

/**
 * API documentation for thread voting
 */
export function SwaggerVoteThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Vote on a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiResponse({ 
      status: 200, 
      description: 'Vote recorded successfully',
      schema: {
        example: {
          success: true,
          updatedVotes: {
            score: 1,
            user_vote: "UP",
            counts: {
              up: 1,
              down: 0
            }
          }
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid vote type' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' })
  );
}

/**
 * API documentation for comment voting
 */
export function SwaggerVoteComment() {
  return applyDecorators(
    ApiOperation({ summary: 'Vote on a comment' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiParam({ name: 'commentId', description: 'Comment ID', type: 'number' }),
    ApiResponse({ 
      status: 200, 
      description: 'Vote recorded successfully',
      schema: {
        example: {
          success: true,
          updatedVotes: {
            score: 1,
            user_vote: "UP",
            counts: {
              up: 1,
              down: 0
            }
          }
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid vote type' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread or comment not found' })
  );
}

/**
 * API documentation for thread bookmarking
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
          success: true,
          bookmark: {
            user_id: 1,
            thread_id: 1,
            created_at: "2025-04-09T20:39:41.242Z"
          }
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' })
  );
}

/**
 * API documentation for thread unbookmarking
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
          success: true
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' })
  );
}

export function SwaggerSearchThreads() {
  return applyDecorators(
    ApiOperation({ summary: 'Search threads', description: 'Case-insensitive search with pagination and optional category filtering' }),
    ApiQuery({ name: 'query', type: String, required: true, description: 'Search query', example: 'nestjs' }),
    ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (default: 1)', example: 1 }),
    ApiQuery({ name: 'limit', type: Number, required: false, description: 'Results per page (default: 10)', example: 10 }),
    ApiQuery({ name: 'category_id', type: Number, required: false, description: 'Filter by category ID', example: 5 }),
    ApiQuery({ name: 'sort', enum: SortType, required: false, description: 'Sort order (LATEST/OLDEST)', example: SortType.LATEST }),
    ApiResponse({
      status: 200, description: 'Paginated search results',
      schema: { example: {
        data: [{
          thread_id: 1, title: 'NestJS Question', created_at: '2025-04-08T03:10:41.929Z',
          author: { id: 1, username: 'user1', name: 'User One' },
          category: { category_id: 2, name: 'Technical Help' },
          _count: { comments: 5, votes: 10 },
          votes: { score: 7, user_vote: 'UP', counts: { up: 7, down: 3 } },
          bookmarked: false
        }],
        meta: { total: 25, page: 1, limit: 10, totalPages: 3, query: 'nestjs' }
      }}
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Missing/invalid token' }),
  );
}

export function SwaggerGetCategories() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all thread categories' }),
    ApiResponse({ 
      status: 200, 
      description: 'List of categories retrieved successfully',
      schema: {
        example: [{
          category_id: 1,
          name: 'Category Name',
          description: 'Category Description',
          created_at: '2025-04-08T03:10:41.929Z',
          updated_at: '2025-04-08T03:10:41.929Z'
        }]
      }
    })
  );
}

export function SwaggerGetThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a thread by ID' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiQuery({ name: 'includeComments', required: false, type: 'boolean', description: 'Include comments in the response' }),
    ApiQuery({ name: 'includeVotes', required: false, type: 'boolean', description: 'Include vote information in the response' }),
    ApiResponse({ 
      status: 200, 
      description: 'Thread retrieved successfully',
      schema: {
        example: {
          thread_id: 1,
          category_id: 1,
          author_user_id: 1,
          title: "Thread Title",
          content: "Thread Content",
          thumbnail_url: null,
          created_at: "2025-04-08T03:10:41.929Z",
          author: {
            id: 1,
            username: "username",
            name: "User Name"
          },
          category: {
            category_id: 1,
            name: "Category Name",
            author_user_id: null
          },
          votes: {
            score: 0,
            user_vote: null,
            counts: {
              up: 0,
              down: 0
            }
          },
          comments: [
            {
              comment_id: 1,
              thread_id: 1,
              author_user_id: 2,
              content: "Comment Content",
              created_at: "2025-04-09T20:39:41.242Z",
              author: {
                id: 2,
                username: "commenter"
              },
              votes: {
                score: 0,
                user_vote: null,
                counts: {
                  up: 0,
                  down: 0
                }
              }
            }
          ],
          _count: {
            comments: 1,
            votes: 0
          },
          bookmarked: false
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' })
  );
}

export function SwaggerUpdateThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiResponse({ 
      status: 200, 
      description: 'Thread updated successfully',
      schema: {
        example: {
          thread_id: 1,
          category_id: 1,
          author_user_id: 1,
          title: "Updated Thread Title",
          content: "Updated Thread Content",
          thumbnail_url: null,
          created_at: "2025-04-08T03:10:41.929Z",
          author: {
            id: 1,
            username: "username",
            name: "User Name"
          },
          category: {
            category_id: 1,
            name: "Category Name",
            author_user_id: null
          },
          _count: {
            comments: 0,
            votes: 0
          },
          votes: {
            score: 0,
            user_vote: null,
            counts: {
              up: 0,
              down: 0
            }
          },
          bookmarked: false
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Not the thread author' }),
    ApiResponse({ status: 404, description: 'Thread not found' })
  );
}

export function SwaggerRemoveThread() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiResponse({ 
      status: 200, 
      description: 'Thread deleted successfully',
      schema: {
        example: {
          success: true
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Not the thread author' }),
    ApiResponse({ status: 404, description: 'Thread not found' })
  );
}

export function SwaggerCreateComment() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a comment on a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiResponse({ 
      status: 201, 
      description: 'Comment created successfully',
      schema: {
        example: {
          comment_id: 1,
          thread_id: 1,
          author_user_id: 2,
          content: "Comment Content",
          created_at: "2025-04-09T20:39:41.242Z",
          author: {
            id: 2,
            username: "commenter"
          },
          votes: {
            score: 0,
            user_vote: null,
            counts: {
              up: 0,
              down: 0
            }
          }
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' })
  );
}

export function SwaggerGetComments() {
  return applyDecorators(
    ApiOperation({ summary: 'Get comments for a thread' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number for pagination' }),
    ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of items per page' }),
    ApiResponse({ 
      status: 200, 
      description: 'Comments retrieved successfully',
      schema: {
        example: {
          data: [{
            comment_id: 1,
            thread_id: 1,
            author_user_id: 2,
            content: "Comment Content",
            created_at: "2025-04-09T20:39:41.242Z",
            author: {
              id: 2,
              username: "commenter"
            },
            votes: {
              score: 0,
              user_vote: null,
              counts: {
                up: 0,
                down: 0
              }
            }
          }],
          meta: {
            total: 20,
            page: 1,
            limit: 10,
            totalPages: 2
          }
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Thread not found' })
  );
}

export function SwaggerUpdateComment() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a comment' }),
    ApiParam({ name: 'id', description: 'Thread ID', type: 'number' }),
    ApiParam({ name: 'commentId', description: 'Comment ID', type: 'number' }),
    ApiResponse({ 
      status: 200, 
      description: 'Comment updated successfully',
      schema: {
        example: {
          comment_id: 1,
          thread_id: 1,
          author_user_id: 2,
          content: "Updated Comment Content",
          created_at: "2025-04-09T20:39:41.242Z",
          author: {
            id: 2,
            username: "commenter"
          },
          votes: {
            score: 0,
            user_vote: null,
            counts: {
              up: 0,
              down: 0
            }
          }
        }
      }
    }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Not the comment author' }),
    ApiResponse({ status: 404, description: 'Thread or comment not found' })
  );
}

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
          success: true
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Not the comment author' }),
    ApiResponse({ status: 404, description: 'Thread or comment not found' })
  );
} 