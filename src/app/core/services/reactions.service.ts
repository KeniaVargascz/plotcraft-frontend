import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReactionResponse, ReactionType } from '../models/reaction.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class ReactionsService {
  private readonly api = inject(HttpApiService);

  toggle(postId: string, reactionType: ReactionType = 'LIKE'): Observable<ReactionResponse> {
    return this.api.post<ReactionResponse>(`/posts/${postId}/reactions`, {
      reactionType,
    });
  }
}
