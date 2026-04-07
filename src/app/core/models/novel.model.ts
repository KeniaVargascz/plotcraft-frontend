import { Genre } from './genre.model';
import { LanguageCatalogItem } from './language.model';
import { CharacterSummary } from './character.model';
import { WorldSummary } from './world.model';

export type NovelStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type NovelRating = 'G' | 'PG' | 'PG13' | 'R' | 'EXPLICIT';
export type RomanceGenre = 'BL' | 'GL' | 'HETEROSEXUAL' | 'OTHER';

export interface NovelPairing {
  id: string;
  isMain: boolean;
  sortOrder: number;
  characterA: { id: string; name: string; slug: string };
  characterB: { id: string; name: string; slug: string };
}

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
  languageId: string;
  language: LanguageCatalogItem | null;
  romanceGenres: RomanceGenre[];
  pairings: NovelPairing[];
  totalWordsCount: number;
  chaptersCount?: number;
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
    subscribersCount: number;
  };
  viewerContext: {
    hasLiked: boolean;
    hasBookmarked: boolean;
    hasKudo: boolean;
    isAuthor: boolean;
    isSubscribed: boolean;
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
  series: {
    id: string;
    title: string;
    slug: string;
    type: string;
    status: string;
    novelsCount: number;
    orderIndex: number;
  } | null;
}
