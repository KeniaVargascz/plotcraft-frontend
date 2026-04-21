import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Genre } from '../models/genre.model';
import { GenreLocalizationService } from './genre-localization.service';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class GenresService {
  private readonly api = inject(HttpApiService);
  private readonly genreLocalization = inject(GenreLocalizationService);

  list(): Observable<Genre[]> {
    return this.api
      .get<Genre[]>('/genres')
      .pipe(map((genres) => this.genreLocalization.canonicalizeGenres(genres)));
  }
}
