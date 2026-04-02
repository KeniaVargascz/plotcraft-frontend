import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ReactionResponse, ReactionType } from '../models/reaction.model';

@Injectable({ providedIn: 'root' })
export class ReactionsService {
  private readonly http = inject(HttpClient);

  toggle(postId: string, reactionType: ReactionType = 'LIKE'): Observable<ReactionResponse> {
    return this.http
      .post<ApiResponse<ReactionResponse>>(`${environment.apiUrl}/posts/${postId}/reactions`, {
        reactionType,
      })
      .pipe(map((response) => response.data));
  }
}
