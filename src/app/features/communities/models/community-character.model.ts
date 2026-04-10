export type CommunityCharacterStatus = 'ACTIVE' | 'SUGGESTED' | 'REJECTED';

export interface CommunityCharacterSuggestor {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface CommunityCharacter {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  status: CommunityCharacterStatus;
  suggestedBy?: CommunityCharacterSuggestor | null;
  suggestedById?: string | null;
  rejectionNote?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCommunityCharacterPayload {
  name: string;
  description?: string;
  avatarUrl?: string;
}

export interface SuggestCommunityCharacterPayload {
  name: string;
  description?: string;
  avatarUrl?: string;
}

export interface UpdateCommunityCharacterPayload {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

export interface ReviewCommunityCharacterPayload {
  note?: string;
}
