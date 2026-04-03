export type NotificationChannel = 'IN_APP' | 'EMAIL';

export interface NotificationPreferences {
  newFollower: boolean;
  newCommentOnPost: boolean;
  newReactionOnPost: boolean;
  newReplyInThread: boolean;
  newChapterFromFollowed: boolean;
  novelMilestone: boolean;
  channel: NotificationChannel;
}
