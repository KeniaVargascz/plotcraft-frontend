import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpApiService } from './http-api.service';

export interface KudoResponse {
  kudosCount: number;
  hasKudo: boolean;
}

@Injectable({ providedIn: 'root' })
export class KudosService {
  private readonly api = inject(HttpApiService);

  addKudo(slug: string): Observable<KudoResponse> {
    return this.api.post<KudoResponse>(`/novels/${slug}/kudos`, {});
  }

  removeKudo(slug: string): Observable<KudoResponse> {
    return this.api.delete<KudoResponse>(`/novels/${slug}/kudos`);
  }

  addCharacterKudo(characterId: string): Observable<KudoResponse> {
    return this.api.post<KudoResponse>(`/kudos/characters/${characterId}`, {});
  }

  removeCharacterKudo(characterId: string): Observable<KudoResponse> {
    return this.api.delete<KudoResponse>(`/kudos/characters/${characterId}`);
  }

  addWorldKudo(worldId: string): Observable<KudoResponse> {
    return this.api.post<KudoResponse>(`/kudos/worlds/${worldId}`, {});
  }

  removeWorldKudo(worldId: string): Observable<KudoResponse> {
    return this.api.delete<KudoResponse>(`/kudos/worlds/${worldId}`);
  }
}
