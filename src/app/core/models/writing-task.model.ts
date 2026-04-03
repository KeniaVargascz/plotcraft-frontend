import { TaskPriority, TaskStatus, TaskType } from './writing-project.model';

export interface WritingTask {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  targetWords: number | null;
  actualWords: number | null;
  sortOrder: number;
  tags: string[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string; color: string | null };
  chapter: { id: string; slug: string; title: string } | null;
  character: { id: string; slug: string; name: string } | null;
  isOverdue: boolean;
}
