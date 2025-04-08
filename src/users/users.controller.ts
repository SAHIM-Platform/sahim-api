import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApprovedStudentGuard } from '@/auth/guards/approved-student.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('test-approved-student')
  @UseGuards(ApprovedStudentGuard)
  testApprovedStudent(@Req() req) {
    return { message: `You are an approved student or an admin ${req.user.sub}!` };
  }

  @Get('me/bookmarks')
  getUserBookmarks(@GetUser('sub') userId) {
    return this.usersService.getUserBookmarks(userId);
  }

  @Get('me')
  async getMe(@GetUser('sub') userId: number) {
    const userData = await this.usersService.findUserById(userId);

    if (!userData) {
      throw new NotFoundException('User not found');
    }

    const { id, name, username, email, role } = userData;
    return { id, name, username, email, role };
  }

}
