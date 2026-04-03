import { CharacterSummary } from './character.model';
import { Genre } from './genre.model';
import { NovelSummary } from './novel.model';
import { PostSearchResult, UserSearchResult } from './search.model';
import { WorldSummary } from './world.model';

export interface DiscoveryNewRelease {
  novel: NovelSummary;
  new_chapters_count: number;
  latest_chapter: {
    title: string;
    slug: string;
    publishedAt: string;
  } | null;
}

export interface GenreSpotlight {
  genre: Pick<Genre, 'slug' | 'label'>;
  top_novels: NovelSummary[];
}

export interface DiscoverySnapshot {
  trending: {
    novels: NovelSummary[];
    worlds: WorldSummary[];
    characters: CharacterSummary[];
    authors: UserSearchResult[];
  };
  new_releases: DiscoveryNewRelease[];
  genres_spotlight: GenreSpotlight[];
  community_posts: PostSearchResult[];
  stats: {
    total_novels: number;
    total_authors: number;
    total_worlds: number;
    total_characters: number;
    total_chapters_published: number;
  };
}

export interface TrendingResponse<T> {
  items: T[];
  period: '72h' | '7d';
  generated_at: string;
}
