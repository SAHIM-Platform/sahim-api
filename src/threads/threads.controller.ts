import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { VoteDto } from './dto/vote.dto';
import { SearchThreadsDto } from './dto/search-threads.dto';
import {
  SwaggerThreads,
  SwaggerCreateThread,
  SwaggerGetThreads,
  SwaggerVoteThread,
  SwaggerVoteComment,
  SwaggerBookmarkThread,
  SwaggerUnbookmarkThread,
  SwaggerSearchThreads,
  SwaggerGetCategories,
  SwaggerGetThread,
  SwaggerUpdateThread,
  SwaggerRemoveThread,
  SwaggerCreateComment,
  SwaggerGetComments,
  SwaggerUpdateComment,
  SwaggerRemoveComment
} from './decorators/swagger.decorators';
import { ThreadQueryDto } from './dto/thread-query.dto';
import { CommentParamsDto, ThreadParamsDto } from './dto/thread-params.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';

@SwaggerThreads()
@UseGuards(JwtAuthGuard)
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) { }

  @Get('search')
  @SwaggerSearchThreads()
  searchThreads(@Query() queryDto: SearchThreadsDto) {
    const { query } = queryDto;
    return this.threadsService.searchThreads(query);
  }

  @Post()
  @SwaggerCreateThread()
  create(@GetUser('sub') userId: number, @Body() createThreadDto: CreateThreadDto) {
    return this.threadsService.create(userId, createThreadDto);
  }

  @Get()
  @SwaggerGetThreads()
  findAll(@GetUser('sub') userId: number, @Query() query: ThreadQueryDto) {
    return this.threadsService.findAll(query, userId);
  }

  @Get('categories')
  @SwaggerGetCategories()
  getAllCategories() {
    return this.threadsService.getAllCategories();
  }

  @Get(':id')
  @SwaggerGetThread()
  findOne(
    @GetUser('sub') userId: number,
    @Param() params: ThreadParamsDto,
    @Query() query: any
  ) {
    return this.threadsService.findOne(params.id, query, userId);
  }

  @Patch(':id')
  @SwaggerUpdateThread()
  update(
    @GetUser('sub') userId: number,
    @Param() params: ThreadParamsDto,
    @Body() updateThreadDto: UpdateThreadDto
  ) {
    return this.threadsService.update(userId, params.id, updateThreadDto);
  }

  @Delete(':id')
  @SwaggerRemoveThread()
  remove(@GetUser('sub') userId: number, @Param() params: ThreadParamsDto) {
    return this.threadsService.remove(userId, params.id);
  }

  @Post(':id/comments')
  @SwaggerCreateComment()
  createComment(
    @GetUser('sub') userId: number,
    @Param() params: ThreadParamsDto,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return this.threadsService.createComment(userId, params.id, createCommentDto);
  }

  @Get(':id/comments')
  @SwaggerGetComments()
  getComments(@Param() params: ThreadParamsDto, @Query() query: CommentQueryDto) {
    return this.threadsService.getThreadComments(params.id, query);
  }

  @Patch(':id/comments/:commentId')
  @SwaggerUpdateComment()
  updateComment(
    @GetUser('sub') userId: number,
    @Param() params: CommentParamsDto,
    @Body() updateCommentDto: UpdateCommentDto
  ) {
    return this.threadsService.updateComment(
      userId,
      params.id,
      params.commentId,
      updateCommentDto
    );
  }

  @Delete(':id/comments/:commentId')
  @SwaggerRemoveComment()
  removeComment(@GetUser('sub') userId: number, @Param() params: CommentParamsDto) {
    return this.threadsService.deleteComment(userId, params.id, params.commentId);
  }

  @Post(':id/vote')
  @SwaggerVoteThread()
  voteThread(
    @GetUser('sub') userId: number,
    @Param() params: ThreadParamsDto,
    @Body() voteDto: VoteDto
  ) {
    return this.threadsService.voteThread(userId, params.id, voteDto);
  }

  @Post(':id/comments/:commentId/vote')
  @SwaggerVoteComment()
  voteComment(
    @GetUser('sub') userId: number,
    @Param() params: CommentParamsDto,
    @Body() voteDto: VoteDto
  ) {
    return this.threadsService.voteComment(userId, params.id, params.commentId, voteDto);
  }

  @Post(':id/bookmark')
  @SwaggerBookmarkThread()
  bookmarkThread(@GetUser('sub') userId: number, @Param() params: ThreadParamsDto) {
    return this.threadsService.bookmarkThread(userId, params.id);
  }

  @Delete(':id/bookmark')
  @SwaggerUnbookmarkThread()
  unbookmarkThread(@GetUser('sub') userId: number, @Param() params: ThreadParamsDto) {
    return this.threadsService.unbookmarkThread(userId, params.id);
  }
}
