export type SeriesType = 'SAGA' | 'TRILOGY' | 'DILOGY' | 'SERIES';
export type SeriesStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'HIATUS';

export const SERIES_TYPE_LABELS: Record<SeriesType, string> = {
  SAGA: 'Saga',
  TRILOGY: 'Trilogía',
  DILOGY: 'Bilogía',
  SERIES: 'Serie',
};

export const SERIES_TYPE_DESCRIPTIONS: Record<SeriesType, string> = {
  SAGA: 'Colección sin límite de entregas',
  TRILOGY: 'Exactamente 3 novelas',
  DILOGY: 'Exactamente 2 novelas',
  SERIES: 'Número variable de entregas',
};

export const SERIES_STATUS_LABELS: Record<SeriesStatus, string> = {
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  ABANDONED: 'Abandonada',
  HIATUS: 'En pausa',
};

export interface SeriesNovelItem {
  orderIndex: number;
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  status: string;
  chaptersCount: number;
  totalWordsCount: number;
}

export interface SeriesAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface SeriesSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: SeriesType;
  status: SeriesStatus;
  coverUrl: string | null;
  novelsCount: number;
  author: SeriesAuthor;
  novelCovers?: (string | null)[];
  createdAt: string;
  updatedAt: string;
}

export interface SeriesDetail extends SeriesSummary {
  novels: SeriesNovelItem[];
}

export interface CreateSeriesPayload {
  title: string;
  description?: string;
  type: SeriesType;
  coverUrl?: string;
}

export interface UpdateSeriesPayload {
  title?: string;
  description?: string;
  coverUrl?: string;
}
