export interface NovelSnapshot {
  date: string;
  views: number;
  likes: number;
  bookmarks: number;
  newReaders: number;
  chaptersRead: number;
}

export interface AuthorSnapshot {
  date: string;
  newFollowers: number;
  profileViews: number;
  postReactions: number;
}

export interface SnapshotTimeline<T> {
  period: string;
  snapshots: T[];
}
