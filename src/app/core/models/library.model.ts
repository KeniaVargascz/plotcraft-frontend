import { ReadingList } from './reading-list.model';
import { ReadingHistoryItem } from './reader.model';

export interface LibraryNovelCard {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  status: string;
  word_count: number;
  views_count: number;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  stats: {
    chapters_count: number;
    likes_count: number;
    bookmarks_count: number;
  };
  reading_progress: {
    chapter_id: string;
    chapter_slug: string;
    chapter_title: string;
    chapter_order: number;
    scroll_pct: number;
    updated_at: string;
  } | null;
  last_chapter: {
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
  target_words: number;
  created_at: string;
  updated_at: string;
  progress: {
    words_read: number;
    pct_complete: number;
    novels_read: number;
    chapters_read: number;
  };
}

export interface ReadingStats {
  total_chapters_read: number;
  total_novels_started: number;
  total_novels_completed: number;
  total_words_read: number;
  total_bookmarks: number;
  total_highlights: number;
  reading_streak_days: number;
  favorite_genre: {
    slug: string;
    label: string;
  } | null;
  monthly_breakdown: Array<{
    year: number;
    month: number;
    words_read: number;
    chapters_read: number;
  }>;
}

export interface LibrarySummary {
  in_progress: LibraryNovelCard[];
  completed: LibraryNovelCard[];
  bookmarked: LibraryNovelCard[];
  reading_lists: ReadingList[];
  active_goal: ReadingGoal | null;
}

export type ChronologicalHistoryResponse = {
  data: ReadingHistoryItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
};
