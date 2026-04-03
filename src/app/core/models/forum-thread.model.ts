import { ForumReply } from './forum-reply.model';
import { ForumPoll } from './forum-poll.model';

export type ForumCategory =
  | 'GENERAL'
  | 'FEEDBACK'
  | 'WRITING_TIPS'
  | 'WORLD_BUILDING'
  | 'CHARACTERS'
  | 'SHOWCASE'
  | 'ANNOUNCEMENTS'
  | 'HELP'
  | 'OFF_TOPIC';

export type ThreadStatus = 'OPEN' | 'CLOSED' | 'PINNED' | 'ARCHIVED';

export type ForumReactionType = 'LIKE' | 'HELPFUL' | 'INSIGHTFUL' | 'FUNNY';

export interface ThreadSummary {
  id: string;
  title: string;
  slug: string;
  category: ForumCategory;
  status: ThreadStatus;
  isPinned: boolean;
  viewsCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  stats: {
    repliesCount: number;
    reactionsCount: number;
    hasSolution: boolean;
    hasPoll: boolean;
  };
  viewerContext: {
    hasReacted: boolean;
    reactionType: ForumReactionType | null;
    hasVoted: boolean;
  } | null;
}

export interface ThreadDetail extends ThreadSummary {
  content: string;
  replies: ForumReply[];
  poll: ForumPoll | null;
}
