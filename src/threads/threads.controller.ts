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
  create(@GetUser('sub') userId, @Body() createThreadDto: CreateThreadDto) {
    return this.threadsService.create(userId, createThreadDto);
  }


  @Get()
  findAll(@Query() query: ThreadQueryDto) {
    return this.threadsService.findAll(query);
  }

  @Get('categories')
  getAllCategories() {
    console.log('inside get categories')
    return this.threadsService.getAllCategories();;
  }

  @Get(':id')
  findOne(@GetUser('sub') userId, @Param() params: ThreadParamsDto, @Query() query: FindOneThreadQueryDto) {
    return this.threadsService.findOne(params.id, query, userId);
  }

  @Put(':id')
  update(@GetUser('sub') userId, @Param() params: ThreadParamsDto, @Body() updateThreadDto: UpdateThreadDto) {
    return this.threadsService.update(userId, params.id, updateThreadDto);
  }

  @Delete(':id')
  remove(@GetUser('sub') userId, @Param() params: ThreadParamsDto) {
    return this.threadsService.remove(userId, params.id);
  }

  @Post(':id/comments')
  createComment(@GetUser('sub') userId, @Param() params: ThreadParamsDto, @Body() createCommentDto: CreateCommentDto) {
    return this.threadsService.createComment(userId, params.id, createCommentDto);
  }

  @Get(':id/comments')
  getThreadComments(@Param() params: ThreadParamsDto, @Query() query: CommentQueryDto) {
    return this.threadsService.getThreadComments(params.id, query);
  }

  @Put(':id/comments/:commentId')
  updateComment(@GetUser('sub') userId, @Param() params: CommentParamsDto, @Body() updateCommentDto: UpdateCommentDto) {
    return this.threadsService.updateComment(userId, params.id, params.commentId, updateCommentDto);
  }

  @Delete(':id/comments/:commentId')
  deleteComment(@GetUser('sub') userId, @Param() params: CommentParamsDto) {
    return this.threadsService.deleteComment(userId, params.id, params.commentId);
  }

  @Post(':id/vote')
  voteThread(@GetUser('sub') userId, @Param() params: ThreadParamsDto, @Body() voteDto: VoteDto) {
    return this.threadsService.voteThread(userId, params.id, voteDto);
  }

  @Post(':id/comments/:commentId/vote')
  voteComment(@GetUser('sub') userId, @Param() params: CommentParamsDto, @Body() voteDto: VoteDto) {
    return this.threadsService.voteComment(userId, params.id, params.commentId, voteDto);
  }

  @Post(':id/bookmark')
  bookmarkThread(@GetUser('sub') userId, @Param() params: ThreadParamsDto) {
    return this.threadsService.bookmarkThread(userId, params.id);
  }

  @Delete(':id/bookmark')
  unbookmarkThread(@GetUser('sub') userId, @Param() params: ThreadParamsDto) {
    return this.threadsService.unbookmarkThread(userId, params.id);
  }

}
