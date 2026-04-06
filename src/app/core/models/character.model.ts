export type CharacterRole =
  | 'PROTAGONIST'
  | 'ANTAGONIST'
  | 'SECONDARY'
  | 'MENTOR'
  | 'ALLY'
  | 'RIVAL'
  | 'NEUTRAL'
  | 'BACKGROUND';

export type CharacterStatus = 'ALIVE' | 'DECEASED' | 'UNKNOWN' | 'UNDEAD' | 'TRANSFORMED';

export interface CharacterSummary {
  id: string;
  name: string;
  slug: string;
  alias: string[];
  role: CharacterRole;
  roleInNovel?: CharacterRole;
  status: CharacterStatus;
  age: string | null;
  appearance: string | null;
  personality: string | null;
  motivations: string | null;
  fears: string | null;
  strengths: string | null;
  weaknesses: string | null;
  backstory: string | null;
  arc: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
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
  world: {
    id: string;
    name: string;
    slug: string;
    visibility?: 'PUBLIC' | 'PRIVATE';
  } | null;
  stats: {
    relationshipsCount: number;
    novelsCount: number;
    kudosCount: number;
  };
  viewerContext: {
    isOwner: boolean;
    hasKudo: boolean;
  } | null;
}

export interface CharacterRelationship {
  id: string;
  type: string;
  description: string | null;
  isMutual: boolean;
  createdAt: string;
  source: {
    id: string;
    name: string;
    slug: string;
    username: string;
  };
  target: {
    id: string;
    name: string;
    slug: string;
    username: string;
    avatarUrl: string | null;
    world: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
}

export interface CharacterDetail extends CharacterSummary {
  relationshipsPreview: CharacterRelationship[];
  linkedNovels: Array<{
    id: string;
    title: string;
    slug: string;
    isPublic: boolean;
  }>;
}
