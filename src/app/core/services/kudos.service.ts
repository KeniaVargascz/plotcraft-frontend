import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface KudoResponse {
  kudosCount: number;
  hasKudo: boolean;
}

@Injectable({ providedIn: 'root' })
export class KudosService {
  private readonly http = inject(HttpClient);

  addKudo(slug: string): Observable<KudoResponse> {
    return this.http
      .post<ApiResponse<KudoResponse>>(`${environment.apiUrl}/novels/${slug}/kudos`, {})
      .pipe(map((r) => r.data));
  }

  removeKudo(slug: string): Observable<KudoResponse> {
    return this.http
      .delete<ApiResponse<KudoResponse>>(`${environment.apiUrl}/novels/${slug}/kudos`)
      .pipe(map((r) => r.data));
  }

  addCharacterKudo(characterId: string): Observable<KudoResponse> {
    return this.http
      .post<ApiResponse<KudoResponse>>(`${environment.apiUrl}/kudos/characters/${characterId}`, {})
      .pipe(map((r) => r.data));
  }

  removeCharacterKudo(characterId: string): Observable<KudoResponse> {
    return this.http
      .delete<ApiResponse<KudoResponse>>(`${environment.apiUrl}/kudos/characters/${characterId}`)
      .pipe(map((r) => r.data));
  }

  addWorldKudo(worldId: string): Observable<KudoResponse> {
    return this.http
      .post<ApiResponse<KudoResponse>>(`${environment.apiUrl}/kudos/worlds/${worldId}`, {})
      .pipe(map((r) => r.data));
  }

  removeWorldKudo(worldId: string): Observable<KudoResponse> {
    return this.http
      .delete<ApiResponse<KudoResponse>>(`${environment.apiUrl}/kudos/worlds/${worldId}`)
      .pipe(map((r) => r.data));
  }
}
