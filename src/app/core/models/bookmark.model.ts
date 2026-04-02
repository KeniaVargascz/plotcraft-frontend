export interface ReaderBookmark {
  id: string;
  anchor_id: string | null;
  label: string | null;
  created_at: string;
  chapter: {
    id: string;
    slug: string;
    title: string;
    order: number;
  };
  novel: {
    id: string;
    slug: string;
    title: string;
  };
}

export interface NovelBookmarksGroup {
  novel: {
    id: string;
    slug: string;
    title: string;
  };
  bookmarks: ReaderBookmark[];
}
