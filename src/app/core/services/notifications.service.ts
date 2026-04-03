import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { AppNotification } from '../models/notification.model';

type NotificationQuery = {
  cursor?: string | null;
  limit?: number;
  isRead?: boolean | null;
};

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  list(query: NotificationQuery = {}): Observable<PaginatedResponse<AppNotification>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<AppNotification>>>(this.baseUrl, {
        params: this.buildParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http
      .get<ApiResponse<{ count: number }>>(`${this.baseUrl}/unread-count`)
      .pipe(map((response) => response.data));
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.http
      .post<ApiResponse<AppNotification>>(`${this.baseUrl}/${id}/read`, {})
      .pipe(map((response) => response.data));
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${this.baseUrl}/read-all`, {})
      .pipe(map((response) => response.data));
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  removeAll(): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(this.baseUrl)
      .pipe(map((response) => response.data));
  }

  private buildParams(query: NotificationQuery): HttpParams {
    let params = new HttpParams();

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }

    if (query.limit) {
      params = params.set('limit', query.limit);
    }

    if (query.isRead !== undefined && query.isRead !== null) {
      params = params.set('isRead', query.isRead);
    }

    return params;
  }
}
