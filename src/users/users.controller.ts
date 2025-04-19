import { Controller, Get, NotFoundException, Req, UseGuards, Query, Body, Delete, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  SwaggerUsersController,
  SwaggerTestApprovedStudent,
  SwaggerGetUserBookmarks,
  SwaggerGetMe,
  SwaggerDeleteMe,
  SwaggerUpdateMe
} from './decorators/swagger.decorators';
import { BookmarksQueryDto } from './dto/bookmarks-query.dto';
import { DeleteMeDto } from './dto/delete-me.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { MyThreadsQueryDto } from './dto/my-threads-query.dto';

@SwaggerUsersController()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('test-approved-student')
  @SwaggerTestApprovedStudent()
  testApprovedStudent(@Req() req) {
    return { message: `You are an approved student or an admin ${req.user.sub}!` };
  }

  @Get('me/threads')
  getMyThreads(@GetUser('sub') userId: number, @Query() query: MyThreadsQueryDto) {
    return this.usersService.getUserThreads(userId, query);
  } 

  @Get('me/bookmarks')
  @SwaggerGetUserBookmarks()
  getUserBookmarks(
    @GetUser('sub') userId: number,
    @Query() query: BookmarksQueryDto
  ) {
    return this.usersService.getUserBookmarks(userId, query);
  }

  @Get('me')
  @SwaggerGetMe()
  async getMe(@GetUser('sub') userId: number) {
    return this.usersService.getUserDetails(userId);
  }

  @Patch('me')
  @SwaggerUpdateMe()
  async updateMe(@GetUser('sub') userId: number, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @Delete('me')
  @SwaggerDeleteMe()
  async deleteMe(@GetUser('sub') userId: number, @Body() dto: DeleteMeDto) {
    await this.usersService.deleteUserAccount(userId, dto.password);
    return { message: 'Account deleted successfully' };
  }
}
