import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PlannerStats } from '../models/planner-stats.model';
import { TaskStatus } from '../models/writing-project.model';
import { WritingProjectSummary } from '../models/writing-project.model';
import { WritingTask } from '../models/writing-task.model';

type PlannerTaskQuery = Partial<{
  status: TaskStatus;
  chapterId: string;
  characterId: string;
  dueFrom: string;
  dueTo: string;
}>;

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/planner`;

  /* ─── Projects ─── */

  listProjects(): Observable<WritingProjectSummary[]> {
    return this.http
      .get<ApiResponse<WritingProjectSummary[]>>(`${this.baseUrl}/projects`)
      .pipe(map((r) => r.data));
  }

  createProject(payload: { name: string; description?: string; color?: string; novelId?: string }) {
    return this.http
      .post<ApiResponse<WritingProjectSummary>>(`${this.baseUrl}/projects`, payload)
      .pipe(map((r) => r.data));
  }

  getProject(id: string) {
    return this.http
      .get<ApiResponse<WritingProjectSummary>>(`${this.baseUrl}/projects/${id}`)
      .pipe(map((r) => r.data));
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
    return this.http
      .patch<ApiResponse<WritingProjectSummary>>(`${this.baseUrl}/projects/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  deleteProject(id: string) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/projects/${id}`)
      .pipe(map((r) => r.data));
  }

  archiveProject(id: string) {
    return this.http
      .patch<ApiResponse<WritingProjectSummary>>(`${this.baseUrl}/projects/${id}/archive`, {})
      .pipe(map((r) => r.data));
  }

  restoreProject(id: string) {
    return this.http
      .patch<ApiResponse<WritingProjectSummary>>(`${this.baseUrl}/projects/${id}/restore`, {})
      .pipe(map((r) => r.data));
  }

  getByNovelSlug(slug: string) {
    return this.http
      .get<ApiResponse<WritingProjectSummary>>(`${environment.apiUrl}/novels/${slug}/planner`)
      .pipe(map((r) => r.data));
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
    return this.http
      .get<ApiResponse<WritingTask[]>>(`${this.baseUrl}/projects/${projectId}/tasks`, { params })
      .pipe(map((r) => r.data));
  }

  createTask(projectId: string, payload: Partial<WritingTask>) {
    return this.http
      .post<ApiResponse<WritingTask>>(`${this.baseUrl}/projects/${projectId}/tasks`, payload)
      .pipe(map((r) => r.data));
  }

  updateTask(projectId: string, taskId: string, payload: Partial<WritingTask>) {
    return this.http
      .patch<
        ApiResponse<WritingTask>
      >(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`, payload)
      .pipe(map((r) => r.data));
  }

  deleteTask(projectId: string, taskId: string) {
    return this.http
      .delete<
        ApiResponse<{ message: string }>
      >(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`)
      .pipe(map((r) => r.data));
  }

  moveTask(projectId: string, taskId: string, payload: { status: string; sortOrder?: number }) {
    return this.http
      .post<
        ApiResponse<WritingTask>
      >(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}/move`, payload)
      .pipe(map((r) => r.data));
  }

  reorderTasks(
    projectId: string,
    payload: { tasks: Array<{ id: string; sortOrder: number }>; status: string },
  ) {
    return this.http
      .patch<
        ApiResponse<{ message: string }>
      >(`${this.baseUrl}/projects/${projectId}/tasks/reorder`, payload)
      .pipe(map((r) => r.data));
  }

  /* ─── Board / Calendar / Stats ─── */

  getBoard(projectId: string) {
    return this.http
      .get<ApiResponse<Record<string, WritingTask[]>>>(`${this.baseUrl}/board/${projectId}`)
      .pipe(map((r) => r.data));
  }

  getCalendar(from: string, to: string) {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http
      .get<ApiResponse<WritingTask[]>>(`${this.baseUrl}/calendar`, { params })
      .pipe(map((r) => r.data));
  }

  getStats(): Observable<PlannerStats> {
    return this.http
      .get<ApiResponse<PlannerStats>>(`${this.baseUrl}/stats`)
      .pipe(map((r) => r.data));
  }
}
