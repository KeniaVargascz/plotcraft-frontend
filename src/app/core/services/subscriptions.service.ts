import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { HttpApiService } from './http-api.service';

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
  private readonly api = inject(HttpApiService);

  subscribe(slug: string): Observable<SubscriptionResponse> {
    return this.api.post<SubscriptionResponse>(`/novels/${slug}/subscribe`, {});
  }

  unsubscribe(slug: string): Observable<SubscriptionResponse> {
    return this.api.delete<SubscriptionResponse>(`/novels/${slug}/subscribe`);
  }

  getMySubscriptions(
    cursor?: string | null,
    limit = 20,
  ): Observable<PaginatedResponse<SubscribedNovel>> {
    let params = new HttpParams().set('limit', limit);
    if (cursor) params = params.set('cursor', cursor);
    return this.api.get<PaginatedResponse<SubscribedNovel>>(
      '/novels/me/subscriptions',
      { params },
    );
  }
}
