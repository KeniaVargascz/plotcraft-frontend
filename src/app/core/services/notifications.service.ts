import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { AppNotification } from '../models/notification.model';
import { HttpApiService } from './http-api.service';

type NotificationQuery = {
  cursor?: string | null;
  limit?: number;
  isRead?: boolean | null;
};

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(HttpApiService);

  list(query: NotificationQuery = {}): Observable<PaginatedResponse<AppNotification>> {
    return this.api.get<PaginatedResponse<AppNotification>>('/notifications', {
      params: this.buildParams(query),
    });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>('/notifications/unread-count');
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.api.post<AppNotification>(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/notifications/read-all', {});
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/notifications/${id}`);
  }

  removeAll(): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/notifications');
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
