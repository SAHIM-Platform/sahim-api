import { Controller, Get, NotFoundException, Req, UseGuards, Query, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApprovedStudentGuard } from '@/auth/guards/approved-student.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';

import { UpdateUserDto } from './dto/update-user.dto';
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


  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @GetUser('sub') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUserProfile(userId, updateUserDto);
  }

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
}
