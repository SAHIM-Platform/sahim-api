import { Controller, Get, Post, Body, Param, Delete, Query, Put } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { ThreadQueryDto } from './dto/thread-query.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { CommentParamsDto, ThreadParamsDto } from './dto/thread-params.dto';
import { FindOneThreadQueryDto } from './dto/find-thread-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { VoteDto } from './dto/vote.dto';
import { BadRequestException } from '@nestjs/common';
import { SearchThreadsDto } from './dto/search-threads.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Threads')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'Authorization', description: 'Bearer token for authentication', required: true })
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) { }

  /**
  * Endpoint for searching threads.
  * 
  * This route handles GET requests to the '/search' endpoint. It expects a query parameter `query`
  * to search for threads in the database. If the query parameter is missing or empty, a BadRequestException
  * is thrown. If a valid query is provided, it will call the service to search for threads and return
  * a formatted list of results.
  * 
  * @param query - The search query string to filter threads by.
  * @returns An array of threads with relevant details such as id, title, creation date, author, and comment count.
  * @throws BadRequestException if the query parameter is missing or empty.
  */
  @Get('search')
  @ApiOperation({ summary: 'Search threads by title or content' })
  @ApiQuery({ name: 'query', required: true, description: 'Search query string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Threads matching the search query',
    schema: {
      example: [{
        id: 1,
        title: 'Thread Title',
        createdAt: '2025-04-08T03:10:41.929Z',
        author: {
          id: 1,
          name: 'User Name'
        },
        commentsCount: 0
      }]
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Query parameter is missing or empty' })
  async searchThreads(@Query() queryDto: SearchThreadsDto) {
   
   const { query } = queryDto;
   
   const results = await this.threadsService.searchThreads(query);
   
   
   return results.map(thread => ({
     id: thread.thread_id,
     title: thread.title,
     createdAt: thread.created_at,
     author: thread.author,
     commentsCount: thread._count.comments,
   }));
  }
  
  
  
  
  @Post()
  @ApiOperation({ summary: 'Create a new thread' })
  @ApiResponse({ 
    status: 201, 
    description: 'Thread created successfully',
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
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  create(@GetUser('sub') userId, @Body() createThreadDto: CreateThreadDto) {
    return this.threadsService.create(userId, createThreadDto);
  }


  @Get()
  @ApiOperation({ summary: 'Get all threads with pagination and filtering' })
  @ApiQuery({ name: 'sort', required: false, enum: ['LATEST', 'POPULAR', 'TRENDING'], description: 'Sort order for threads' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of items per page' })
  @ApiQuery({ name: 'category_id', required: false, type: 'number', description: 'Filter threads by category ID' })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@GetUser('sub') userId: number, @Query() query: ThreadQueryDto) {
    return this.threadsService.findAll(query, userId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all thread categories' })
  @ApiResponse({ 
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
  getAllCategories() {
    console.log('inside get categories')
    return this.threadsService.getAllCategories();;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a thread by ID' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiQuery({ name: 'includeComments', required: false, type: 'boolean', description: 'Include comments in the response' })
  @ApiQuery({ name: 'includeVotes', required: false, type: 'boolean', description: 'Include vote information in the response' })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  findOne(@GetUser('sub') userId, @Param() params: ThreadParamsDto, @Query() query: FindOneThreadQueryDto) {
    return this.threadsService.findOne(params.id, query, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the thread author' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  update(@GetUser('sub') userId, @Param() params: ThreadParamsDto, @Body() updateThreadDto: UpdateThreadDto) {
    return this.threadsService.update(userId, params.id, updateThreadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thread deleted successfully',
    schema: {
      example: {
        success: true
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the thread author' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  remove(@GetUser('sub') userId, @Param() params: ThreadParamsDto) {
    return this.threadsService.remove(userId, params.id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Create a comment on a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  createComment(@GetUser('sub') userId, @Param() params: ThreadParamsDto, @Body() createCommentDto: CreateCommentDto) {
    return this.threadsService.createComment(userId, params.id, createCommentDto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of items per page' })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  getThreadComments(@Param() params: ThreadParamsDto, @Query() query: CommentQueryDto) {
    return this.threadsService.getThreadComments(params.id, query);
  }

  @Put(':id/comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: 'number' })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the comment author' })
  @ApiResponse({ status: 404, description: 'Thread or comment not found' })
  updateComment(@GetUser('sub') userId, @Param() params: CommentParamsDto, @Body() updateCommentDto: UpdateCommentDto) {
    return this.threadsService.updateComment(userId, params.id, params.commentId, updateCommentDto);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comment deleted successfully',
    schema: {
      example: {
        success: true
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the comment author' })
  @ApiResponse({ status: 404, description: 'Thread or comment not found' })
  deleteComment(@GetUser('sub') userId, @Param() params: CommentParamsDto) {
    return this.threadsService.deleteComment(userId, params.id, params.commentId);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vote recorded successfully',
    schema: {
      example: {
        success: true,
        updatedVotes: {
          score: 1,
          user_vote: "UP",
          counts: {
            up: 5,
            down: 2
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid vote type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  voteThread(@GetUser('sub') userId, @Param() params: ThreadParamsDto, @Body() voteDto: VoteDto) {
    return this.threadsService.voteThread(userId, params.id, voteDto);
  }

  @Post(':id/comments/:commentId/vote')
  @ApiOperation({ summary: 'Vote on a comment' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vote recorded successfully',
    schema: {
      example: {
        success: true,
        updatedVotes: {
          score: 1,
          user_vote: "UP",
          counts: {
            up: 3,
            down: 1
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid vote type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Thread or comment not found' })
  voteComment(@GetUser('sub') userId, @Param() params: CommentParamsDto, @Body() voteDto: VoteDto) {
    return this.threadsService.voteComment(userId, params.id, params.commentId, voteDto);
  }

  @Post(':id/bookmark')
  @ApiOperation({ summary: 'Bookmark a thread' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiResponse({ 
    status: 201, 
    description: 'Thread bookmarked successfully',
    schema: {
      example: {
        message: "Thread bookmarked successfully",
        success: true
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Thread already bookmarked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  bookmarkThread(@GetUser('sub') userId, @Param() params: ThreadParamsDto) {
    return this.threadsService.bookmarkThread(userId, params.id);
  }

  @Delete(':id/bookmark')
  @ApiOperation({ summary: 'Remove a thread bookmark' })
  @ApiParam({ name: 'id', description: 'Thread ID', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Bookmark removed successfully',
    schema: {
      example: {
        message: "Thread unbookmarked successfully",
        success: true
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Thread not bookmarked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  unbookmarkThread(@GetUser('sub') userId, @Param() params: ThreadParamsDto) {
    return this.threadsService.unbookmarkThread(userId, params.id);
  }

}
