export interface ForumReply {
  id: string;
  content: string;
  parentReplyId: string | null;
  isSolution: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  reactions: {
    total: number;
    byType: Record<string, number>;
  };
  viewerContext: {
    hasReacted: boolean;
    reactionType: string | null;
  } | null;
}
