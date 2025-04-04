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

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  create(@GetUser('sub') userId, @Body() createThreadDto: CreateThreadDto) {
    return this.threadsService.create(userId, createThreadDto);
  }

  @Get()
  findAll(@Query() query: ThreadQueryDto) {
    return this.threadsService.findAll(query);
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

}
