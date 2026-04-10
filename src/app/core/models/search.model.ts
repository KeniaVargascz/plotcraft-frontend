import { CharacterSummary } from './character.model';
import { PaginatedResponse } from './feed-pagination.model';
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
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  latest_covers?: Array<string | null>;
  stats: {
    followers_count: number;
    novels_count: number;
    worlds_count: number;
  };
}

export interface PostSearchResult {
  id: string;
  content_excerpt: string;
  type: PostType;
  created_at: string;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  stats: {
    reactions_count: number;
    comments_count: number;
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
  avatar_url: string | null;
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

export type SearchNovelsResponse = PaginatedResponse<NovelSummary>;
export type SearchWorldsResponse = PaginatedResponse<WorldSummary>;
export type SearchCharactersResponse = PaginatedResponse<CharacterSummary>;
export type SearchUsersResponse = PaginatedResponse<UserSearchResult>;
export type SearchPostsResponse = PaginatedResponse<PostSearchResult>;
