import { ReactionType } from './reaction.model';

export type PostType =
  | 'TEXT'
  | 'UPDATE'
  | 'WORLDBUILDING'
  | 'SHOWCASE'
  | 'ANNOUNCEMENT'
  | 'NEW_CHAPTER'
  | 'NEW_NOVEL'
  | 'WORLD_UPDATE'
  | 'NEW_CHARACTER'
  | 'RECOMMENDATION';

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

export interface LinkedNovel {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  coverUrl: string | null;
  status: string;
  chaptersCount: number;
  author: PostAuthor;
}

export interface LinkedChapter {
  id: string;
  title: string;
  slug: string;
  order: number;
  wordCount: number;
  publishedAt: string | null;
  novelTitle: string;
  novelSlug: string;
}

export interface LinkedWorld {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  coverUrl: string | null;
  genre: string | null;
}

export interface LinkedCharacter {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  role: string;
  authorUsername: string;
}

export interface PostLinkedContent {
  novel: LinkedNovel | null;
  chapter: LinkedChapter | null;
  world: LinkedWorld | null;
  characters: LinkedCharacter[];
}

export interface PostModel {
  id: string;
  content: string;
  type: PostType;
  imageUrls: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  stats: PostStats;
  viewerContext: PostViewerContext | null;
  commentsEnabled: boolean;
  linkedContent: PostLinkedContent | null;
}
