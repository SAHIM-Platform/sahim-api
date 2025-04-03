import { Controller, Get, Post, Body, Param, Delete, Query, Put } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { ThreadQueryDto } from './dto/thread-query.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { ThreadParamsDto } from './dto/thread-params.dto';
import { FindOneThreadQueryDto } from './dto/find-thread-query.dto';

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

}
