import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { RomanceGenreCatalogItem } from '../models/romance-genre.model';

@Injectable({ providedIn: 'root' })
export class RomanceGenresService {
  private readonly http = inject(HttpClient);

  private readonly romanceGenres$ = this.http
    .get<ApiResponse<RomanceGenreCatalogItem[]>>(`${environment.apiUrl}/catalogs/romance-genres`)
    .pipe(
      map((response) => response.data),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  list(): Observable<RomanceGenreCatalogItem[]> {
    return this.romanceGenres$;
  }
}
