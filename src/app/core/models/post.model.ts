import { ReactionType } from './reaction.model';

export type PostType = 'TEXT' | 'UPDATE' | 'WORLDBUILDING' | 'SHOWCASE' | 'ANNOUNCEMENT';

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface PostStats {
  commentsCount: number;
  reactionsCount: number;
  reactionsSummary: Record<ReactionType, number>;
}

export interface PostViewerContext {
  hasReacted: boolean;
  reactionType: ReactionType | null;
  hasSaved: boolean;
}

export interface PostModel {
  id: string;
  content: string;
  type: PostType;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  stats: PostStats;
  viewerContext: PostViewerContext | null;
}
