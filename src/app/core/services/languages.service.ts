import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LanguageCatalogItem } from '../models/language.model';

@Injectable({ providedIn: 'root' })
export class LanguagesService {
  private readonly http = inject(HttpClient);

  private readonly languages$ = this.http
    .get<ApiResponse<LanguageCatalogItem[]>>(`${environment.apiUrl}/catalogs/languages`)
    .pipe(
      map((response) => response.data),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  list(): Observable<LanguageCatalogItem[]> {
    return this.languages$;
  }
}
