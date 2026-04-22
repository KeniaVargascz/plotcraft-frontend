export type ReadingListVisibility = 'PUBLIC' | 'PRIVATE';

export interface ReadingListItem {
  novel: {
    id: string;
    slug: string;
    title: string;
    coverUrl: string | null;
    status: string;
    author: {
      username: string;
      displayName: string;
    };
    stats: {
      chaptersCount: number;
      likesCount: number;
    };
  };
  personal_note: string | null;
  added_at: string;
}

export interface ReadingList {
  id: string;
  name: string;
  description: string | null;
  visibility: ReadingListVisibility;
  createdAt: string;
  updatedAt: string;
  owner: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  items_count: number;
  contains_novel?: boolean;
  items?: ReadingListItem[];
}
