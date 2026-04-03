export interface ForumPoll {
  id: string;
  question: string;
  status: 'OPEN' | 'CLOSED';
  closesAt: string | null;
  totalVotes: number;
  options: {
    id: string;
    text: string;
    order: number;
    votesCount: number;
    pct: number;
  }[];
  viewerContext: {
    votedOptionId: string | null;
  } | null;
}
