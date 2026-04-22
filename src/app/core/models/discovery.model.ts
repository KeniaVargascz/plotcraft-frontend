import { CharacterSummary } from './character.model';
import { Genre } from './genre.model';
import { NovelSummary } from './novel.model';
import { PostSearchResult, UserSearchResult } from './search.model';
import { WorldSummary } from './world.model';

export interface DiscoveryNewRelease {
  novel: NovelSummary;
  newChaptersCount: number;
  latestChapter: {
    title: string;
    slug: string;
    publishedAt: string;
  } | null;
}

export interface GenreSpotlight {
  genre: Pick<Genre, 'slug' | 'label'>;
  topNovels: NovelSummary[];
}

export interface DiscoverySnapshot {
  trending: {
    novels: NovelSummary[];
    worlds: WorldSummary[];
    characters: CharacterSummary[];
    authors: UserSearchResult[];
  };
  newReleases: DiscoveryNewRelease[];
  genresSpotlight: GenreSpotlight[];
  communityPosts: PostSearchResult[];
  stats: {
    totalNovels: number;
    totalAuthors: number;
    totalWorlds: number;
    totalCharacters: number;
    totalChaptersPublished: number;
  };
}

export interface TrendingResponse<T> {
  items: T[];
  period: '72h' | '7d';
  generatedAt: string;
}
