import { Genre } from './genre.model';

export type NovelStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type NovelRating = 'G' | 'PG' | 'PG13' | 'R' | 'EXPLICIT';

export interface NovelSummary {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  coverUrl: string | null;
  status: NovelStatus;
  rating: NovelRating;
  tags: string[];
  warnings: string[];
  isPublic: boolean;
  wordCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  genres: Genre[];
  stats: {
    chaptersCount: number;
    publishedChaptersCount: number;
    likesCount: number;
    bookmarksCount: number;
  };
  viewerContext: {
    hasLiked: boolean;
    hasBookmarked: boolean;
    isAuthor: boolean;
  } | null;
}

export interface NovelChapterSummary {
  id: string;
  title: string;
  slug: string;
  order: number;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  wordCount: number;
  publishedAt: string | null;
  updatedAt: string;
}

export interface NovelDetail extends NovelSummary {
  chapters: NovelChapterSummary[];
}
