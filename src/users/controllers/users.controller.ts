import { Controller, Get, NotFoundException, Req, UseGuards, Query, Body, Delete, Patch } from '@nestjs/common';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  SwaggerUsersController,
  SwaggerTestApprovedStudent,
  SwaggerGetUserBookmarks,
  SwaggerGetMe,
  SwaggerDeleteMe,
  SwaggerUpdateMe
} from '../decorators/swagger.decorators';
import { BookmarksQueryDto } from '../dto/bookmarks-query.dto';
import { DeleteMeDto } from '../dto/delete-me.dto';
import { UpdateMeDto } from '../dto/update-me.dto';
import { MyThreadsQueryDto } from '../dto/my-threads-query.dto';
import { UserContentService } from '../services/user-content.service';
import { UserDetailsService } from '../services/user-details.service';
import { UserService } from '../services/user.service';

@SwaggerUsersController()
@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly userContentService: UserContentService,
    private readonly userDetailsService: UserDetailsService,

  ) {}

  @Get('test-approved-student')
  @SwaggerTestApprovedStudent()
  testApprovedStudent(@Req() req) {
    return { message: `You are an approved student or an admin ${req.user.sub}!` };
  }

  @Get('me/threads')
  async getMyThreads(@GetUser('sub') userId: number, @Query() query: MyThreadsQueryDto) {
    return await this.userContentService.getUserThreads(userId, query);
  } 

  @Get('me/bookmarks')
  @SwaggerGetUserBookmarks()
  async getUserBookmarks(
    @GetUser('sub') userId: number,
    @Query() query: BookmarksQueryDto
  ) {
    return await this.userContentService.getUserBookmarks(userId, query);
  }

  @Get('me')
  @SwaggerGetMe()
  async getMe(@GetUser('sub') userId: number) {
    return await this.userDetailsService.getUserDetails(userId);
  }

  @Patch('me')
  @SwaggerUpdateMe()
  async updateMe(@GetUser('sub') userId: number, @Body() dto: UpdateMeDto) {
    return await this.userService.updateMe(userId, dto);
  }

  @Delete('me')
  @SwaggerDeleteMe()
  async deleteMe(@GetUser('sub') userId: number, @Body() dto: DeleteMeDto) {
    return await this.userService.deleteUserAccount(userId, dto.password);
  }
}
