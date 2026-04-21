import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { LanguageCatalogItem } from '../models/language.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class LanguagesService {
  private readonly api = inject(HttpApiService);

  private readonly languages$ = this.api
    .get<LanguageCatalogItem[]>('/catalogs/languages')
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  list(): Observable<LanguageCatalogItem[]> {
    return this.languages$;
  }
}
