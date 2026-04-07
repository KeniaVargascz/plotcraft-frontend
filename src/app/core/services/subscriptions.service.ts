import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';

export interface SubscriptionResponse {
  subscribersCount: number;
  isSubscribed: boolean;
}

export interface SubscribedNovel {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  subscribedAt: string;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
  latestChapter: { id: string; title: string; slug: string; publishedAt: string } | null;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private readonly http = inject(HttpClient);

  subscribe(slug: string): Observable<SubscriptionResponse> {
    return this.http
      .post<ApiResponse<SubscriptionResponse>>(
        `${environment.apiUrl}/novels/${slug}/subscribe`,
        {},
      )
      .pipe(map((r) => r.data));
  }

  unsubscribe(slug: string): Observable<SubscriptionResponse> {
    return this.http
      .delete<ApiResponse<SubscriptionResponse>>(`${environment.apiUrl}/novels/${slug}/subscribe`)
      .pipe(map((r) => r.data));
  }

  getMySubscriptions(
    cursor?: string | null,
    limit = 20,
  ): Observable<PaginatedResponse<SubscribedNovel>> {
    let params = new HttpParams().set('limit', limit);
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<ApiResponse<PaginatedResponse<SubscribedNovel>>>(
        `${environment.apiUrl}/novels/me/subscriptions`,
        { params },
      )
      .pipe(map((r) => r.data));
  }
}
