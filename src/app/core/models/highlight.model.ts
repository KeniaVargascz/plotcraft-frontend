export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface Highlight {
  id: string;
  anchorId: string;
  startOffset: number;
  endOffset: number;
  color: HighlightColor;
  note: string | null;
  createdAt: string;
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
