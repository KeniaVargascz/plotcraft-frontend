export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskType =
  | 'CHAPTER'
  | 'CHARACTER'
  | 'WORLDBUILDING'
  | 'PLANNING'
  | 'REVISION'
  | 'RESEARCH'
  | 'PUBLICATION'
  | 'OTHER';

export interface WritingProjectSummary {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  novel: { id: string; slug: string; title: string } | null;
  stats: {
    total: number;
    byStatus: { BACKLOG: number; IN_PROGRESS: number; REVIEW: number; DONE: number };
    overdue: number;
    completionPct: number;
  };
}
