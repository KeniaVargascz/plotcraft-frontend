export type WorldVisibility = 'PUBLIC' | 'PRIVATE';

export type WorldGenre =
  | 'FANTASIA'
  | 'REALISTA'
  | 'POSAPOCALIPTICO'
  | 'CIENCIA_FICCION'
  | 'DISTOPIA'
  | 'STEAMPUNK'
  | 'CYBERPUNK'
  | 'MEDIEVAL'
  | 'MITOLOGICO'
  | 'HORROR'
  | 'URBANO'
  | 'HISTORICO'
  | 'SURREAL';

export const WORLD_GENRE_LABELS: Record<WorldGenre, string> = {
  FANTASIA: 'Fantasia',
  REALISTA: 'Realista',
  POSAPOCALIPTICO: 'Posapocaliptico',
  CIENCIA_FICCION: 'Ciencia ficcion',
  DISTOPIA: 'Distopia',
  STEAMPUNK: 'Steampunk',
  CYBERPUNK: 'Cyberpunk',
  MEDIEVAL: 'Medieval',
  MITOLOGICO: 'Mitologico',
  HORROR: 'Horror',
  URBANO: 'Urbano',
  HISTORICO: 'Historico',
  SURREAL: 'Surreal',
};

export interface WorldSummary {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  setting: string | null;
  magicSystem: string | null;
  rules: string | null;
  coverUrl: string | null;
  mapUrl: string | null;
  genre: WorldGenre | null;
  visibility: WorldVisibility;
  tags: string[];
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  stats: {
    locationsCount: number;
    charactersCount: number;
    novelsCount: number;
  };
  viewerContext: {
    isOwner: boolean;
  } | null;
  wbSummary?: {
    categoriesCount: number;
    entriesCount: number;
    publicEntriesCount: number;
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      icon: string | null;
      color: string | null;
      sortOrder: number;
      entriesCount: number;
    }>;
  };
}

export interface WorldLocation {
  id: string;
  name: string;
  type: string;
  description: string | null;
  isNotable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorldDetail extends WorldSummary {
  locations: WorldLocation[];
  linkedNovels: Array<{
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    isPublic: boolean;
  }>;
}
