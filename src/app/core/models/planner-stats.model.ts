import { WritingTask } from './writing-task.model';

export interface PlannerStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  tasksDone: number;
  tasksOverdue: number;
  tasksInProgress: number;
  completionRate: number;
  wordsTargeted: number;
  wordsWritten: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recentCompletions: WritingTask[];
}
