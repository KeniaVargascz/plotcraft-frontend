export type ReaderFontFamily = 'crimson' | 'outfit' | 'georgia' | 'mono';
export type ReaderMode = 'scroll' | 'paginated';

export interface ReaderPreferences {
  id: string;
  font_family: ReaderFontFamily;
  font_size: number;
  line_height: number;
  max_width: number;
  reading_mode: ReaderMode;
  show_progress: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReadingProgress {
  novel_id: string;
  chapter_id: string;
  scroll_pct: number;
  chapter: {
    slug: string;
    title: string;
    order: number;
  };
  updated_at: string;
}

export interface ReadingHistoryItem {
  novel: {
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    author: {
      username: string;
      display_name: string;
    };
  };
  chapter: {
    id: string;
    slug: string;
    title: string;
    order: number;
  };
  opened_at: string;
}
