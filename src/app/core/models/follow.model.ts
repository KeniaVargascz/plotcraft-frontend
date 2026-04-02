export interface FollowModel {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
  followersCount?: number;
}
