import { Controller, Get, NotFoundException, Req, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApprovedStudentGuard } from '@/auth/guards/approved-student.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import {
  SwaggerUsersController,
  SwaggerTestApprovedStudent,
  SwaggerGetUserBookmarks,
  SwaggerGetMe
} from './decorators/swagger.decorators';
import { BookmarksQueryDto } from './dto/bookmarks-query.dto';

@SwaggerUsersController()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('test-approved-student')
  @SwaggerTestApprovedStudent()
  testApprovedStudent(@Req() req) {
    return { message: `You are an approved student or an admin ${req.user.sub}!` };
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
}
