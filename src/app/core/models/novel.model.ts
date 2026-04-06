import { Genre } from './genre.model';
import { CharacterSummary } from './character.model';
import { WorldSummary } from './world.model';

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
    worldsCount: number;
    charactersCount: number;
    kudosCount: number;
    votesCount: number;
  };
  viewerContext: {
    hasLiked: boolean;
    hasBookmarked: boolean;
    hasKudo: boolean;
    isAuthor: boolean;
    reading_progress: {
      chapter_id: string;
      chapter_slug: string;
      chapter_title: string;
      chapter_order: number;
      scroll_pct: number;
    } | null;
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
  worlds: WorldSummary[];
  characters: CharacterSummary[];
}
