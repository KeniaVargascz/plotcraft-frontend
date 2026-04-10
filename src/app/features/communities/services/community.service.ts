import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PaginatedResponse } from '../../../core/models/feed-pagination.model';
import {
  Community,
  CommunityMemberProfile,
  CommunityType,
  CreateCommunityPayload,
  UpdateCommunityPayload,
} from '../models/community.model';

export interface CommunityQuery {
  cursor?: string | null;
  limit?: number;
  type?: CommunityType | null;
  search?: string | null;
}

export interface MembershipResult {
  membersCount: number;
  isMember: boolean;
}

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/communities`;

  getCommunities(query: CommunityQuery = {}): Observable<PaginatedResponse<Community>> {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.type) params = params.set('type', query.type);
    if (query.search) params = params.set('search', query.search);
    return this.http
      .get<ApiResponse<PaginatedResponse<Community>>>(this.baseUrl, { params })
      .pipe(map((r) => r.data));
  }

  getCommunityBySlug(slug: string): Observable<Community> {
    return this.http
      .get<ApiResponse<Community>>(`${this.baseUrl}/${slug}`)
      .pipe(map((r) => r.data));
  }

  create(payload: CreateCommunityPayload): Observable<Community> {
    return this.http.post<ApiResponse<Community>>(this.baseUrl, payload).pipe(map((r) => r.data));
  }

  update(slug: string, payload: UpdateCommunityPayload): Observable<Community> {
    return this.http
      .patch<ApiResponse<Community>>(`${this.baseUrl}/${slug}`, payload)
      .pipe(map((r) => r.data));
  }

  delete(slug: string, force = false): Observable<{ message: string }> {
    let params = new HttpParams();
    if (force) params = params.set('force', 'true');
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${slug}`, { params })
      .pipe(map((r) => r.data));
  }

  join(slug: string): Observable<MembershipResult> {
    return this.http
      .post<ApiResponse<MembershipResult>>(`${this.baseUrl}/${slug}/join`, {})
      .pipe(map((r) => r.data));
  }

  leave(slug: string): Observable<MembershipResult> {
    return this.http
      .delete<ApiResponse<MembershipResult>>(`${this.baseUrl}/${slug}/leave`)
      .pipe(map((r) => r.data));
  }

  getMembers(slug: string): Observable<CommunityMemberProfile[]> {
    return this.http
      .get<ApiResponse<CommunityMemberProfile[]>>(`${this.baseUrl}/${slug}/members`)
      .pipe(map((r) => r.data));
  }

  follow(slug: string): Observable<{ followersCount: number; isFollowing: boolean }> {
    return this.http
      .post<
        ApiResponse<{ followersCount: number; isFollowing: boolean }>
      >(`${this.baseUrl}/${slug}/follow`, {})
      .pipe(map((r) => r.data));
  }

  unfollow(slug: string): Observable<{ followersCount: number; isFollowing: boolean }> {
    return this.http
      .delete<
        ApiResponse<{ followersCount: number; isFollowing: boolean }>
      >(`${this.baseUrl}/${slug}/follow`)
      .pipe(map((r) => r.data));
  }

  getMyCommunities(): Observable<Community[]> {
    return this.http
      .get<ApiResponse<Community[]>>(`${environment.apiUrl}/me/communities`)
      .pipe(map((r) => r.data));
  }

  getMyFollowedCommunities(): Observable<Community[]> {
    return this.http
      .get<ApiResponse<Community[]>>(`${environment.apiUrl}/me/communities/following`)
      .pipe(map((r) => r.data));
  }

  getMyOwnedCommunities(): Observable<Community[]> {
    return this.http
      .get<ApiResponse<Community[]>>(`${environment.apiUrl}/me/communities/owned`)
      .pipe(map((r) => r.data));
  }

  addRelatedNovel(slug: string, novelId: string): Observable<Community> {
    return this.http
      .post<ApiResponse<Community>>(`${this.baseUrl}/${slug}/related-novels`, { novelId })
      .pipe(map((r) => r.data));
  }

  removeRelatedNovel(slug: string, novelId: string): Observable<Community> {
    return this.http
      .delete<ApiResponse<Community>>(`${this.baseUrl}/${slug}/related-novels/${novelId}`)
      .pipe(map((r) => r.data));
  }

  getPendingCommunities(): Observable<Community[]> {
    return this.http
      .get<ApiResponse<Community[]>>(`${environment.apiUrl}/admin/communities/pending`)
      .pipe(map((r) => r.data));
  }

  approveCommunity(slug: string): Observable<Community> {
    return this.http
      .post<ApiResponse<Community>>(`${environment.apiUrl}/admin/communities/${slug}/approve`, {})
      .pipe(map((r) => r.data));
  }

  rejectCommunity(slug: string, reason: string): Observable<Community> {
    return this.http
      .post<
        ApiResponse<Community>
      >(`${environment.apiUrl}/admin/communities/${slug}/reject`, { reason })
      .pipe(map((r) => r.data));
  }
}
