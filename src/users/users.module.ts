import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UsersController } from './controllers/users.controller';
import { ThreadsModule } from '@/threads/threads.module';
import { UserContentService } from './services/user-content.service';
import { UserDetailsService } from './services/user-details.service';

@Module({
  imports: [ThreadsModule],
  controllers: [UsersController],
  providers: [UserService, UserContentService, UserDetailsService],
  exports: [UserService, UserDetailsService],
})
export class UsersModule {}
