export interface AuthorAnalytics {
  totals: {
    totalNovels: number;
    publishedNovels: number;
    totalChapters: number;
    publishedChapters: number;
    totalWordsPublished: number;
    totalViews: number;
    totalLikes: number;
    totalBookmarks: number;
    totalReadersUnique: number;
    totalFollowers: number;
    totalPosts: number;
    totalPostReactions: number;
  };
  topNovels: {
    novel: { id: string; title: string; slug: string; coverUrl: string | null };
    views: number;
    likes: number;
    readers: number;
    completionRate: number;
  }[];
  recentActivity: {
    newFollowers: number;
    newLikes: number;
    newReaders: number;
    chaptersPublished: number;
  };
}

export interface AudienceStats {
  followers: { total: number; growth30d: number; growthPct: number };
  readers: { totalUnique: number; returning: number; retentionRate: number };
  topGenres: { genre: { slug: string; label: string }; readersCount: number }[];
  engagement: {
    avgLikesPerNovel: number;
    avgReadersPerNovel: number;
    avgCompletionRate: number;
  };
}
