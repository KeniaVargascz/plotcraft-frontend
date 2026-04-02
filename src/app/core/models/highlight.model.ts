export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface Highlight {
  id: string;
  anchor_id: string;
  start_offset: number;
  end_offset: number;
  color: HighlightColor;
  note: string | null;
  created_at: string;
  chapter: {
    id: string;
    slug: string;
    title: string;
  };
  novel: {
    id: string;
    slug: string;
    title: string;
  };
}
