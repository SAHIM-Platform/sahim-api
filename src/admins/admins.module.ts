import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [AdminsController],
  providers: [AdminsService]
})
export class AdminsModule {}
