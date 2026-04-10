import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface ChapterVoteResponse {
  chapterId: string;
  votesCount: number;
  hasVoted: boolean;
}

@Injectable({ providedIn: 'root' })
export class VotesService {
  private readonly http = inject(HttpClient);

  castVote(chapterId: string): Observable<ChapterVoteResponse> {
    return this.http
      .post<
        ApiResponse<ChapterVoteResponse>
      >(`${environment.apiUrl}/votes/chapters/${chapterId}`, {})
      .pipe(map((r) => r.data));
  }

  removeVote(chapterId: string): Observable<ChapterVoteResponse> {
    return this.http
      .delete<ApiResponse<ChapterVoteResponse>>(`${environment.apiUrl}/votes/chapters/${chapterId}`)
      .pipe(map((r) => r.data));
  }

  getVoteStatus(chapterId: string): Observable<ChapterVoteResponse> {
    return this.http
      .get<ApiResponse<ChapterVoteResponse>>(`${environment.apiUrl}/votes/chapters/${chapterId}/me`)
      .pipe(map((r) => r.data));
  }
}
