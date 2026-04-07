export interface ForumLastThreadAuthor {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ForumLastThread {
  title: string;
  slug: string;
  createdAt: string;
  author: ForumLastThreadAuthor;
}

export interface CommunityForum {
  id: string;
  communityId: string;
  communitySlug?: string;
  communityName?: string;
  name: string;
  slug: string;
  description: string | null;
  rules: string | null;
  isPublic: boolean;
  membersCount: number;
  threadsCount: number;
  lastThread: ForumLastThread | null;
  isMember: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumMember {
  id: string;
  forumId: string;
  userId: string;
  joinedAt: string;
}

export interface ForumThreadAuthor {
  id?: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export type ForumThreadStatus = 'OPEN' | 'CLOSED' | 'PINNED' | 'ARCHIVED';

export interface ForumPollOption {
  id: string;
  text: string;
  votesCount: number;
}

export interface ForumPoll {
  id: string;
  question: string;
  closesAt: string | null;
  options: ForumPollOption[];
  totalVotes: number;
  viewerVoteOptionId?: string | null;
}

export interface ForumThreadReactionsSummary {
  total: number;
  byType?: Record<string, number>;
  viewerReaction?: string | null;
}

export interface ForumThread {
  id: string;
  forumId: string;
  forumSlug?: string;
  forumName?: string;
  communitySlug?: string;
  communityName?: string;
  authorId: string;
  author: ForumThreadAuthor;
  title: string;
  slug: string;
  content: string;
  status: ForumThreadStatus;
  isPinned: boolean;
  viewsCount: number;
  repliesCount: number;
  reactionsCount: number;
  tags: string[];
  poll?: ForumPoll | null;
  reactions?: ForumThreadReactionsSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  authorId: string;
  author: ForumThreadAuthor;
  content: string;
  reactionsCount: number;
  reactions?: ForumThreadReactionsSummary;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ThreadSortBy = 'newest' | 'most_replies' | 'most_reactions';

export interface CreateForumPayload {
  name: string;
  description?: string;
  rules?: string;
  isPublic?: boolean;
}

export interface UpdateForumPayload {
  name?: string;
  description?: string;
  rules?: string;
  isPublic?: boolean;
}

export interface CreateThreadPayload {
  title: string;
  content: string;
  tags?: string[];
  poll?: {
    question: string;
    options: string[];
    closesAt?: string | null;
  } | null;
}

export interface ForumMembershipResult {
  membersCount: number;
  isMember: boolean;
}
