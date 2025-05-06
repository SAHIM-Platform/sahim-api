import { Module } from '@nestjs/common';
import { ThreadsController } from './controllers/threads.controller';
import { ThreadService } from './services/thread.service';
import { CommentService } from './services/comment.service';
import { BookmarkService } from './services/bookmark.service';
import { VotingService } from './services/voting.service';

@Module({
  controllers: [ThreadsController],
  providers: [ThreadService, CommentService, BookmarkService, VotingService],
  exports: [ThreadService]
})
export class ThreadsModule {}
