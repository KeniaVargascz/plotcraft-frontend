import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { RomanceGenreCatalogItem } from '../models/romance-genre.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class RomanceGenresService {
  private readonly api = inject(HttpApiService);

  private readonly romanceGenres$ = this.api
    .get<RomanceGenreCatalogItem[]>('/catalogs/romance-genres')
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  list(): Observable<RomanceGenreCatalogItem[]> {
    return this.romanceGenres$;
  }
}
