import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApprovedStudentGuard } from '@/auth/guards/approved-student.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('test-approved-student')
  @UseGuards(ApprovedStudentGuard)
  testApprovedStudent(@Req() req) {
    return { message: `You are an approved student or an admin ${req.user.sub}!` };
  }
}
