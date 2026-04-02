export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CommentModel {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  author: CommentAuthor;
}
