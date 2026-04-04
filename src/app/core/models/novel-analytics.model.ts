export interface NovelAnalytics {
  novel: { id: string; title: string; slug: string; status: string; createdAt: string };
  totals: {
    views: number;
    likes: number;
    bookmarks: number;
    totalReaders: number;
    completedReaders: number;
    completionRate: number;
    totalWords: number;
    avgReadTimeMin: number;
  };
  periodDelta: {
    views: { value: number; pct: number };
    likes: { value: number; pct: number };
    bookmarks: { value: number; pct: number };
    newReaders: { value: number; pct: number };
    chaptersRead: { value: number; pct: number };
  } | null;
  chapters: ChapterStats[];
}

export interface ChapterStats {
  id: string;
  title: string;
  slug: string;
  order: number;
  status: string;
  publishedAt: string | null;
  wordCount: number;
  stats: {
    reads: number;
    uniqueReads: number;
    completionRate: number;
    avgReadTimeMin: number;
  };
}
