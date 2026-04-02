export type ReadingListVisibility = 'PUBLIC' | 'PRIVATE';

export interface ReadingListItem {
  novel: {
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    status: string;
    author: {
      username: string;
      display_name: string;
    };
    stats: {
      chapters_count: number;
      likes_count: number;
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
  created_at: string;
  updated_at: string;
  owner: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  items_count: number;
  contains_novel?: boolean;
  items?: ReadingListItem[];
}
