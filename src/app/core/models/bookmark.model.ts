export interface ReaderBookmark {
  id: string;
  anchorId: string | null;
  label: string | null;
  createdAt: string;
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
