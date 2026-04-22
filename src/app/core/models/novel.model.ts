import { Genre } from './genre.model';
import { LanguageCatalogItem } from './language.model';
import { RomanceGenreCatalogItem } from './romance-genre.model';
import { CharacterSummary } from './character.model';
import { WorldSummary } from './world.model';

export type NovelStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED' | 'HIATUS';
export type NovelRating = 'G' | 'PG' | 'T' | 'R' | 'EXPLICIT';
export type NovelType = 'ORIGINAL' | 'FANFIC';

export interface NovelLinkedCommunity {
  id: string;
  slug: string;
  name: string;
  type?: string;
  coverUrl?: string | null;
  description?: string | null;
}

export interface NovelCommunityCharacter {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  roleInNovel?: string | null;
}

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
  warnings: { id: string; slug: string; label: string }[];
  isPublic: boolean;
  wordCount: number;
  viewsCount: number;
  languageId: string;
  language: LanguageCatalogItem | null;
  romanceGenres: RomanceGenreCatalogItem[];
  pairings: NovelPairing[];
  totalWordsCount: number;
  chaptersCount?: number;
  novelType?: NovelType;
  isAlternateUniverse?: boolean;
  linkedCommunityId?: string | null;
  linkedCommunity?: NovelLinkedCommunity | null;
  chapters?: { id: string; title: string; slug: string; order: number }[];
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
    commentsCount: number;
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
    readingProgress: {
      chapterId: string;
      chapterSlug: string;
      chapterTitle: string;
      chapterOrder: number;
      scrollPct: number;
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
  communityCharacters?: NovelCommunityCharacter[];
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
