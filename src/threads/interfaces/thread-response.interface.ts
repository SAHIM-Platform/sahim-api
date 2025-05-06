import { VoteType } from '@prisma/client';

interface Vote {
  vote_type: VoteType;
  voter_user_id: number;
}

interface FormattedVote {
  score: number; 
  user_vote: VoteType | null; 
  counts: {
    up: number; 
    down: number; 
  };
}

export interface ThreadResponse {
  thread_id: number;
  category_id: number;
  author_user_id: number;
  title: string;
  content: string;
  thumbnail_url: string | null;
  created_at: Date;
  votes?: FormattedVote; 
}
