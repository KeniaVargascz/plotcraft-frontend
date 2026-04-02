export interface Profile {
  id: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  website?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
