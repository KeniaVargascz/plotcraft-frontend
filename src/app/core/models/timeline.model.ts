export type TimelineEventType =
  | 'WORLD_EVENT'
  | 'STORY_EVENT'
  | 'CHARACTER_ARC'
  | 'CHAPTER_EVENT'
  | 'LORE_EVENT'
  | 'NOTE';
export type TimelineEventRelevance = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'BACKGROUND';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  type: TimelineEventType;
  relevance: TimelineEventRelevance;
  dateLabel: string | null;
  sortOrder: number;
  color: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  chapter: { id: string; slug: string; title: string; order: number } | null;
  character: { id: string; slug: string; name: string; avatarUrl: string | null } | null;
  world: { id: string; slug: string; name: string } | null;
  wbEntry: {
    id: string;
    slug: string;
    name: string;
    category: { name: string; icon: string | null; color: string | null };
  } | null;
}

export interface TimelineSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  novel: { id: string; slug: string; title: string } | null;
  eventsCount: number;
}

export interface TimelineDetail extends TimelineSummary {
  events: TimelineEvent[];
}
