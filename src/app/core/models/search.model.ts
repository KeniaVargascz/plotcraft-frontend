import { CharacterSummary } from './character.model';
import { PagedResponse } from './feed-pagination.model';
import { NovelSummary } from './novel.model';
import { PostType } from './post.model';
import { WorldSummary } from './world.model';

export type SearchTab = 'all' | 'novels' | 'worlds' | 'characters' | 'users' | 'posts' | 'mixed';

export type SearchSection =
  | 'novelas'
  | 'mundos'
  | 'personajes'
  | 'usuarios'
  | 'feed'
  | 'foro'
  | 'comunidad';

export interface SearchResult {
  id: string;
  type: 'novel' | 'world' | 'character' | 'user' | 'post' | 'thread' | 'community';
  section: SearchSection;
  title: string;
  excerpt: string;
  author: { username: string; displayName: string; avatarUrl: string | null } | null;
  url: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface MixedSearchResponse {
  query: string;
  results: SearchResult[];
  pagination?: { nextCursor: string | null; hasMore: boolean };
}

export type SearchNovelSort = 'relevance' | 'recent' | 'popular' | 'views';
export type SearchWorldSort = 'relevance' | 'recent' | 'popular';
export type SearchUserSort = 'relevance' | 'followers' | 'recent';
export type SearchPostSort = 'relevance' | 'recent' | 'reactions';

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  latestCovers?: Array<string | null>;
  stats: {
    followersCount: number;
    novelsCount: number;
    worldsCount: number;
  };
}

export interface PostSearchResult {
  id: string;
  contentExcerpt: string;
  type: PostType;
  createdAt: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  stats: {
    reactionsCount: number;
    commentsCount: number;
  };
}

export interface SearchGroupedSection<T> {
  items: T[];
  total_hint: number;
}

export interface SearchResponse {
  query: string;
  results: {
    novels: SearchGroupedSection<NovelSummary>;
    worlds: SearchGroupedSection<WorldSummary>;
    characters: SearchGroupedSection<CharacterSummary>;
    users: SearchGroupedSection<UserSearchResult>;
    posts: SearchGroupedSection<PostSearchResult>;
  };
}

export interface SearchSuggestion {
  type: 'novel' | 'user' | 'world' | 'character';
  label: string;
  sublabel: string;
  url: string;
  avatarUrl: string | null;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  createdAt: string;
}

export interface SearchHistoryResponse {
  history: SearchHistoryItem[];
}

export type SearchNovelsResponse = PagedResponse<NovelSummary>;
export type SearchWorldsResponse = PagedResponse<WorldSummary>;
export type SearchCharactersResponse = PagedResponse<CharacterSummary>;
export type SearchUsersResponse = PagedResponse<UserSearchResult>;
export type SearchPostsResponse = PagedResponse<PostSearchResult>;
