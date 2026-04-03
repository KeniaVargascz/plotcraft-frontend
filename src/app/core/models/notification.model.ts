export type NotificationType =
  | 'NEW_FOLLOWER'
  | 'NEW_COMMENT'
  | 'NEW_REACTION'
  | 'NEW_REPLY'
  | 'NEW_CHAPTER'
  | 'NOVEL_MILESTONE'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}
