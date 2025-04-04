// FILENAME: threads.types.ts
import { VoteType } from '@prisma/client';

export interface ThreadFindOneOptions {
  includeComments?: boolean;
  commentsPage?: number;
  commentsLimit?: number;
  includeVotes?: boolean;
}

export interface FormattedVote {
  score: number;
  user_vote: VoteType | null;
  counts: {
    up: number;
    down: number;
  };
}

export interface ThreadCommentWithVotes {
  comment_id: number;
  content: string;
  created_at: Date;
  author: {
    id: number;
    username: string;
  };
  votes?: FormattedVote;
}

export interface ThreadWithDetails {
  thread_id: number;
  title: string;
  content: string;
  created_at: Date;
  author: {
    id: number;
    username: string;
    name: string;
  };
  category: {
    category_id: number;
    name: string;
  };
  votes?: FormattedVote;
  comments?: ThreadCommentWithVotes[];
  _count?: {
    comments?: number;
    votes?: number;
  };
}