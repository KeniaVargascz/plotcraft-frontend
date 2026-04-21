import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpApiService } from './http-api.service';

export interface ChapterVoteResponse {
  chapterId: string;
  votesCount: number;
  hasVoted: boolean;
}

@Injectable({ providedIn: 'root' })
export class VotesService {
  private readonly api = inject(HttpApiService);

  castVote(chapterId: string): Observable<ChapterVoteResponse> {
    return this.api.post<ChapterVoteResponse>(`/votes/chapters/${chapterId}`, {});
  }

  removeVote(chapterId: string): Observable<ChapterVoteResponse> {
    return this.api.delete<ChapterVoteResponse>(`/votes/chapters/${chapterId}`);
  }

  getVoteStatus(chapterId: string): Observable<ChapterVoteResponse> {
    return this.api.get<ChapterVoteResponse>(`/votes/chapters/${chapterId}/me`);
  }
}
