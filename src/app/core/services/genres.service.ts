import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Genre } from '../models/genre.model';
import { GenreLocalizationService } from './genre-localization.service';

@Injectable({ providedIn: 'root' })
export class GenresService {
  private readonly http = inject(HttpClient);
  private readonly genreLocalization = inject(GenreLocalizationService);

  list(): Observable<Genre[]> {
    return this.http
      .get<ApiResponse<Genre[]>>(`${environment.apiUrl}/genres`)
      .pipe(map((response) => this.genreLocalization.canonicalizeGenres(response.data)));
  }
}
