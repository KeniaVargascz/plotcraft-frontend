export type ReaderFontFamily = 'crimson' | 'outfit' | 'georgia' | 'mono';
export type ReaderMode = 'scroll' | 'paginated';

export interface ReaderPreferences {
  id: string;
  fontFamily: ReaderFontFamily;
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
  readingMode: ReaderMode;
  showProgress: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  novelId: string;
  chapterId: string;
  scrollPct: number;
  chapter: {
    slug: string;
    title: string;
    order: number;
  };
  updatedAt: string;
}

export interface ReadingHistoryItem {
  novel: {
    id: string;
    slug: string;
    title: string;
    coverUrl: string | null;
    author: {
      username: string;
      displayName: string;
    };
  };
  chapter: {
    id: string;
    slug: string;
    title: string;
    order: number;
  };
  openedAt: string;
}
