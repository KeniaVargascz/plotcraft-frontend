export type ChapterStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

export interface ChapterSummary {
  id: string;
  title: string;
  slug: string;
  order: number;
  status: ChapterStatus;
  wordCount: number;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterDetail extends ChapterSummary {
  content: string;
  contentSnapshot: unknown;
  novel: {
    id: string;
    title: string;
    slug: string;
    author: {
      id: string;
      username: string;
      displayName: string;
    };
  };
  navigation: {
    previous: Pick<ChapterSummary, 'id' | 'slug' | 'title' | 'order'> | null;
    next: Pick<ChapterSummary, 'id' | 'slug' | 'title' | 'order'> | null;
  } | null;
}
