import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/feed-pagination.model';
import { FollowModel } from '../models/follow.model';

@Injectable({ providedIn: 'root' })
export class FollowsService {
  private readonly http = inject(HttpClient);

  follow(username: string): Observable<{ followed: boolean }> {
    return this.http
      .post<ApiResponse<{ followed: boolean }>>(`${environment.apiUrl}/follows/${username}`, {})
      .pipe(map((response) => response.data));
  }

  unfollow(username: string): Observable<{ followed: boolean }> {
    return this.http
      .delete<ApiResponse<{ followed: boolean }>>(`${environment.apiUrl}/follows/${username}`)
      .pipe(map((response) => response.data));
  }

  getFollowers(
    username: string,
    cursor?: string | null,
    limit = 20,
  ): Observable<PaginatedResponse<FollowModel>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<FollowModel>>>(
        `${environment.apiUrl}/follows/${username}/followers`,
        {
          params: this.buildParams(cursor, limit),
        },
      )
      .pipe(map((response) => response.data));
  }

  getFollowing(
    username: string,
    cursor?: string | null,
    limit = 20,
  ): Observable<PaginatedResponse<FollowModel>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<FollowModel>>>(
        `${environment.apiUrl}/follows/${username}/following`,
        {
          params: this.buildParams(cursor, limit),
        },
      )
      .pipe(map((response) => response.data));
  }

  getSuggestions(): Observable<FollowModel[]> {
    return this.http
      .get<ApiResponse<FollowModel[]>>(`${environment.apiUrl}/follows/me/suggestions`)
      .pipe(map((response) => response.data));
  }

  private buildParams(cursor?: string | null, limit = 20) {
    let params = new HttpParams().set('limit', limit);

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return params;
  }
}
