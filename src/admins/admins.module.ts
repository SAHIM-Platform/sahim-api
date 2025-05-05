import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller';
import { AdminManagementService } from './services/admin-management.service';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { StudentApprovalService } from './services/student-approval.service';
import { CategoryService } from './services/category.service';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [AdminsController],
  providers: [AdminManagementService, StudentApprovalService, CategoryService]
})
export class AdminsModule {}
