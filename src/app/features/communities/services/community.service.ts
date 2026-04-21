import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpApiService } from '../../../core/services/http-api.service';
import { PagedResponse } from '../../../core/models/feed-pagination.model';
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
  page?: number;
}

export interface MembershipResult {
  membersCount: number;
  isMember: boolean;
}

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly api = inject(HttpApiService);

  getCommunities(query: CommunityQuery = {}): Observable<PagedResponse<Community>> {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.type) params = params.set('type', query.type);
    if (query.search) params = params.set('search', query.search);
    if (query.page) params = params.set('page', query.page);
    return this.api.get<PagedResponse<Community>>('/communities', { params });
  }

  getCommunityBySlug(slug: string): Observable<Community> {
    return this.api.get<Community>(`/communities/${slug}`);
  }

  create(payload: CreateCommunityPayload): Observable<Community> {
    return this.api.post<Community>('/communities', payload);
  }

  update(slug: string, payload: UpdateCommunityPayload): Observable<Community> {
    return this.api.patch<Community>(`/communities/${slug}`, payload);
  }

  delete(slug: string, force = false): Observable<{ message: string }> {
    let params = new HttpParams();
    if (force) params = params.set('force', 'true');
    return this.api.delete<{ message: string }>(`/communities/${slug}`, { params });
  }

  join(slug: string): Observable<MembershipResult> {
    return this.api.post<MembershipResult>(`/communities/${slug}/join`, {});
  }

  leave(slug: string): Observable<MembershipResult> {
    return this.api.delete<MembershipResult>(`/communities/${slug}/leave`);
  }

  getMembers(slug: string): Observable<CommunityMemberProfile[]> {
    return this.api.get<CommunityMemberProfile[]>(`/communities/${slug}/members`);
  }

  follow(slug: string): Observable<{ followersCount: number; isFollowing: boolean }> {
    return this.api.post<{ followersCount: number; isFollowing: boolean }>(
      `/communities/${slug}/follow`,
      {},
    );
  }

  unfollow(slug: string): Observable<{ followersCount: number; isFollowing: boolean }> {
    return this.api.delete<{ followersCount: number; isFollowing: boolean }>(
      `/communities/${slug}/follow`,
    );
  }

  getMyCommunities(): Observable<Community[]> {
    return this.api.get<Community[]>('/me/communities');
  }

  getMyFollowedCommunities(): Observable<Community[]> {
    return this.api.get<Community[]>('/me/communities/following');
  }

  getMyOwnedCommunities(): Observable<Community[]> {
    return this.api.get<Community[]>('/me/communities/owned');
  }

  addRelatedNovel(slug: string, novelId: string): Observable<Community> {
    return this.api.post<Community>(`/communities/${slug}/related-novels`, { novelId });
  }

  removeRelatedNovel(slug: string, novelId: string): Observable<Community> {
    return this.api.delete<Community>(`/communities/${slug}/related-novels/${novelId}`);
  }

  getPendingCommunities(): Observable<Community[]> {
    return this.api.get<Community[]>('/admin/communities/pending');
  }

  approveCommunity(slug: string): Observable<Community> {
    return this.api.post<Community>(`/admin/communities/${slug}/approve`, {});
  }

  rejectCommunity(slug: string, reason: string): Observable<Community> {
    return this.api.post<Community>(`/admin/communities/${slug}/reject`, { reason });
  }
}
