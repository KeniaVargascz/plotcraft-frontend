import { RomanceGenre } from '../../core/models/novel.model';

export interface RomanceGenreOption {
  value: RomanceGenre;
  label: string;
}

export const ROMANCE_GENRES: RomanceGenreOption[] = [
  { value: 'BL', label: 'BL (Boys Love)' },
  { value: 'GL', label: 'GL (Girls Love)' },
  { value: 'HETEROSEXUAL', label: 'Heterosexual' },
  { value: 'OTHER', label: 'Otros' },
];

export const ROMANCE_GENRE_LABELS: Record<RomanceGenre, string> = {
  BL: 'BL',
  GL: 'GL',
  HETEROSEXUAL: 'Heterosexual',
  OTHER: 'Otros',
};
