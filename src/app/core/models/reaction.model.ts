export type ReactionType = 'LIKE' | 'LOVE' | 'FIRE' | 'CLAP';

export interface ReactionResponse {
  reacted: boolean;
  reactionType: ReactionType | null;
  newCount: number;
}
