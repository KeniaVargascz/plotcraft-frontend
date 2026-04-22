import { ReadingList } from './reading-list.model';
import { ReadingHistoryItem } from './reader.model';

export interface LibraryNovelCard {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  status: string;
  wordCount: number;
  viewsCount: number;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  stats: {
    chaptersCount: number;
    likesCount: number;
    bookmarksCount: number;
  };
  readingProgress: {
    chapterId: string;
    chapterSlug: string;
    chapterTitle: string;
    chapterOrder: number;
    scrollPct: number;
    updatedAt: string;
  } | null;
  lastChapter: {
    id: string;
    slug: string;
    title: string;
    order: number;
  } | null;
}

export interface ReadingGoal {
  id: string;
  year: number;
  month: number | null;
  targetWords: number;
  createdAt: string;
  updatedAt: string;
  progress: {
    wordsRead: number;
    pctComplete: number;
    novelsRead: number;
    chaptersRead: number;
  };
}

export interface ReadingStats {
  totalChaptersRead: number;
  totalNovelsStarted: number;
  totalNovelsCompleted: number;
  totalWordsRead: number;
  totalBookmarks: number;
  totalHighlights: number;
  readingStreakDays: number;
  favoriteGenre: {
    slug: string;
    label: string;
  } | null;
  monthlyBreakdown: Array<{
    year: number;
    month: number;
    wordsRead: number;
    chaptersRead: number;
  }>;
}

export interface LibrarySummary {
  inProgress: LibraryNovelCard[];
  completed: LibraryNovelCard[];
  bookmarked: LibraryNovelCard[];
  readingLists: ReadingList[];
  activeGoal: ReadingGoal | null;
}

export type ChronologicalHistoryResponse = {
  data: ReadingHistoryItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
};
