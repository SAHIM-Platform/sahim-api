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
import { ThreadService } from './services/thread.service';
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
import { CommentService } from './services/comment.service';
import { BookmarkService } from './services/bookmark.service';
import { VotingService } from './services/voting.service';
import { FindOneThreadQueryDto } from './dto/find-thread-query.dto';

@SwaggerThreads()
@UseGuards(JwtAuthGuard)
@Controller('threads')
export class ThreadsController {
  constructor(
    private readonly threadService: ThreadService,
    private readonly commentService: CommentService,
    private readonly bookmarkService: BookmarkService,
    private readonly votingService: VotingService,
  ) { }

  @Get('search')
  @SwaggerSearchThreads()
  async searchThreads(@GetUser('sub') userId: number,@Query() queryDto: SearchThreadsDto) {
    return await this.threadService.searchThreads(queryDto, userId);
  }

  @Post()
  @SwaggerCreateThread()
  async create(@GetUser('sub') userId: number, @Body() createThreadDto: CreateThreadDto) {
    return await this.threadService.create(userId, createThreadDto);
  }

  @Get()
  @SwaggerGetThreads()
  async findAll(@GetUser('sub') userId: number, @Query() query: ThreadQueryDto) {
    return await this.threadService.findAll(query, userId);
  }

  @Get('categories')
  @SwaggerGetCategories()
  async getAllCategories() {
    return await this.threadService.getAllCategories();
  }

  @Get(':id')
  @SwaggerGetThread()
  async findOne(
    @GetUser('sub') userId: number,
    @Param() params: ThreadParamsDto,
    @Query() query: FindOneThreadQueryDto
  ) {
    return await this.threadService.findOne(params.id, query, userId);
  }

  @Patch(':id')
  @SwaggerUpdateThread()
  async update(
    @GetUser('sub') userId: number,
    @Param() params: ThreadParamsDto,
    @Body() updateThreadDto: UpdateThreadDto
  ) {
    return await this.threadService.update(userId, params.id, updateThreadDto);
  }

  @Delete(':id')
  @SwaggerRemoveThread()
  async remove(@GetUser('sub') userId: number, @Param() params: ThreadParamsDto) {
    return await this.threadService.remove(userId, params.id);
  }

  @Post(':id/comments')
  @SwaggerCreateComment()
  async createComment(
    @GetUser('sub') userId: number,
    @Param() params: ThreadParamsDto,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return await this.commentService.createComment(userId, params.id, createCommentDto);
  }

  @Get(':id/comments')
  @SwaggerGetComments()
  async getComments(@Param() params: ThreadParamsDto, @Query() query: CommentQueryDto) {
    return await this.commentService.getThreadComments(params.id, query);
  }

  @Patch(':id/comments/:commentId')
  @SwaggerUpdateComment()
  async updateComment(
    @GetUser('sub') userId: number,
    @Param() params: CommentParamsDto,
    @Body() updateCommentDto: UpdateCommentDto
  ) {
    return await this.commentService.updateComment(
      userId,
      params.id,
      params.commentId,
      updateCommentDto
    );
  }

  @Delete(':id/comments/:commentId')
  @SwaggerRemoveComment()
  async removeComment(@GetUser('sub') userId: number, @Param() params: CommentParamsDto) {
    return await this.commentService.deleteComment(userId, params.id, params.commentId);
  }

  @Post(':id/vote')
  @SwaggerVoteThread()
  async voteThread(
    @GetUser('sub') userId: number,
    @Param() params: ThreadParamsDto,
    @Body() voteDto: VoteDto
  ) {
    return await this.votingService.voteThread(userId, params.id, voteDto);
  }

  @Post(':id/comments/:commentId/vote')
  @SwaggerVoteComment()
  async voteComment(
    @GetUser('sub') userId: number,
    @Param() params: CommentParamsDto,
    @Body() voteDto: VoteDto
  ) {
    return await this.votingService.voteComment(userId, params.id, params.commentId, voteDto);
  }

  @Post(':id/bookmark')
  @SwaggerBookmarkThread()
  async bookmarkThread(@GetUser('sub') userId: number, @Param() params: ThreadParamsDto) {
    return await this.bookmarkService.bookmarkThread(userId, params.id);
  }

  @Delete(':id/bookmark')
  @SwaggerUnbookmarkThread()
  async unbookmarkThread(@GetUser('sub') userId: number, @Param() params: ThreadParamsDto) {
    return await this.bookmarkService.unbookmarkThread(userId, params.id);
  }
}
