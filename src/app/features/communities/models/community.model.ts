export type CommunityType = 'PRIVATE' | 'PUBLIC' | 'FANDOM';
export type CommunityStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

export const COMMUNITY_TYPE_LABELS: Record<CommunityType, string> = {
  PRIVATE: 'Privada',
  PUBLIC: 'Pública',
  FANDOM: 'Fandom',
};

export const COMMUNITY_STATUS_LABELS: Record<CommunityStatus, string> = {
  PENDING: 'Pendiente de revisión',
  ACTIVE: 'Activa',
  REJECTED: 'Rechazada',
  SUSPENDED: 'Suspendida',
};

export interface CommunityOwner {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface CommunityLinkedNovel {
  title: string;
  slug: string;
  coverUrl: string | null;
  authorUsername: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  type: CommunityType;
  status: CommunityStatus;
  description: string | null;
  coverUrl: string | null;
  bannerUrl: string | null;
  rules: string | null;
  rejectionReason: string | null;
  membersCount: number;
  followersCount: number;
  owner: CommunityOwner | null;
  linkedNovel: CommunityLinkedNovel | null;
  isMember: boolean;
  isFollowing: boolean;
  isOwner: boolean;
  isFollowingOwner: boolean;
  forums: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMemberProfile {
  id: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  joinedAt: string;
}

export interface CreateCommunityPayload {
  name: string;
  type: CommunityType;
  description?: string;
  rules?: string;
  coverUrl?: string;
  bannerUrl?: string;
  linkedNovelId?: string;
}

export interface UpdateCommunityPayload {
  name?: string;
  description?: string;
  rules?: string;
  coverUrl?: string;
  bannerUrl?: string;
}
