import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PlannerStats } from '../models/planner-stats.model';
import { TaskStatus } from '../models/writing-project.model';
import { WritingProjectSummary } from '../models/writing-project.model';
import { WritingTask } from '../models/writing-task.model';
import { HttpApiService } from './http-api.service';

type PlannerTaskQuery = Partial<{
  status: TaskStatus;
  chapterId: string;
  characterId: string;
  dueFrom: string;
  dueTo: string;
}>;

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly api = inject(HttpApiService);

  /* ─── Projects ─── */

  listProjects(): Observable<WritingProjectSummary[]> {
    return this.api.get<WritingProjectSummary[]>('/planner/projects');
  }

  createProject(payload: { name: string; description?: string; color?: string; novelId?: string }) {
    return this.api.post<WritingProjectSummary>('/planner/projects', payload);
  }

  getProject(id: string) {
    return this.api.get<WritingProjectSummary>(`/planner/projects/${id}`);
  }

  updateProject(
    id: string,
    payload: Partial<{
      name: string;
      description: string | null;
      color: string | null;
      isActive: boolean;
    }>,
  ) {
    return this.api.patch<WritingProjectSummary>(`/planner/projects/${id}`, payload);
  }

  deleteProject(id: string) {
    return this.api.delete<{ message: string }>(`/planner/projects/${id}`);
  }

  archiveProject(id: string) {
    return this.api.patch<WritingProjectSummary>(`/planner/projects/${id}/archive`, {});
  }

  restoreProject(id: string) {
    return this.api.patch<WritingProjectSummary>(`/planner/projects/${id}/restore`, {});
  }

  getByNovelSlug(slug: string) {
    return this.api.get<WritingProjectSummary>(`/novels/${slug}/planner`);
  }

  /* ─── Tasks ─── */

  listTasks(projectId: string, query?: PlannerTaskQuery): Observable<WritingTask[]> {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params = params.set(key, value);
        }
      });
    }
    return this.api.get<WritingTask[]>(`/planner/projects/${projectId}/tasks`, { params });
  }

  createTask(projectId: string, payload: Partial<WritingTask>) {
    return this.api.post<WritingTask>(`/planner/projects/${projectId}/tasks`, payload);
  }

  updateTask(projectId: string, taskId: string, payload: Partial<WritingTask>) {
    return this.api.patch<WritingTask>(
      `/planner/projects/${projectId}/tasks/${taskId}`,
      payload,
    );
  }

  deleteTask(projectId: string, taskId: string) {
    return this.api.delete<{ message: string }>(
      `/planner/projects/${projectId}/tasks/${taskId}`,
    );
  }

  moveTask(projectId: string, taskId: string, payload: { status: string; sortOrder?: number }) {
    return this.api.post<WritingTask>(
      `/planner/projects/${projectId}/tasks/${taskId}/move`,
      payload,
    );
  }

  reorderTasks(
    projectId: string,
    payload: { tasks: Array<{ id: string; sortOrder: number }>; status: string },
  ) {
    return this.api.patch<{ message: string }>(
      `/planner/projects/${projectId}/tasks/reorder`,
      payload,
    );
  }

  /* ─── Board / Calendar / Stats ─── */

  getBoard(projectId: string) {
    return this.api.get<Record<string, WritingTask[]>>(`/planner/board/${projectId}`);
  }

  getCalendar(from: string, to: string) {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.api.get<WritingTask[]>('/planner/calendar', { params });
  }

  getStats(): Observable<PlannerStats> {
    return this.api.get<PlannerStats>('/planner/stats');
  }
}
