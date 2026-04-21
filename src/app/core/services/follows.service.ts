import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { FollowModel } from '../models/follow.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class FollowsService {
  private readonly api = inject(HttpApiService);

  follow(username: string): Observable<{ followed: boolean }> {
    return this.api.post<{ followed: boolean }>(`/follows/${username}`, {});
  }

  unfollow(username: string): Observable<{ followed: boolean }> {
    return this.api.delete<{ followed: boolean }>(`/follows/${username}`);
  }

  getFollowers(
    username: string,
    cursor?: string | null,
    limit = 20,
  ): Observable<PaginatedResponse<FollowModel>> {
    return this.api.get<PaginatedResponse<FollowModel>>(
      `/follows/${username}/followers`,
      {
        params: this.buildParams(cursor, limit),
      },
    );
  }

  getFollowing(
    username: string,
    cursor?: string | null,
    limit = 20,
  ): Observable<PaginatedResponse<FollowModel>> {
    return this.api.get<PaginatedResponse<FollowModel>>(
      `/follows/${username}/following`,
      {
        params: this.buildParams(cursor, limit),
      },
    );
  }

  getSuggestions(): Observable<FollowModel[]> {
    return this.api.get<FollowModel[]>('/follows/me/suggestions');
  }

  private buildParams(cursor?: string | null, limit = 20) {
    let params = new HttpParams().set('limit', limit);

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return params;
  }
}
