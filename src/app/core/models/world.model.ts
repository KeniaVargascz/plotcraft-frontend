export type WorldVisibility = 'PUBLIC' | 'PRIVATE';

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
