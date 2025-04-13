import { Controller, Get, NotFoundException, Req, UseGuards, Query, Body, Patch } from '@nestjs/common';
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
  SwaggerGetMe,
  SwaggerUpdateMe
} from './decorators/swagger.decorators';
import { BookmarksQueryDto } from './dto/bookmarks-query.dto';
import { UpdateMeDto } from './dto/update-me.dto';

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
    const userData = await this.usersService.findUserById(userId);

    if (!userData) {
      throw new NotFoundException('User not found');
    }

    const { id, name, username, email, role } = userData;
    return { id, name, username, email, role };
  }

  @Patch('me')
  @SwaggerUpdateMe()
  async updateMe(@GetUser('sub') userId: number, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(userId, dto);
  }
}
