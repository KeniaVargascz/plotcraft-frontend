import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Genre } from '../models/genre.model';

@Injectable({ providedIn: 'root' })
export class GenresService {
  private readonly http = inject(HttpClient);

  list(): Observable<Genre[]> {
    return this.http
      .get<ApiResponse<Genre[]>>(`${environment.apiUrl}/genres`)
      .pipe(map((response) => response.data));
  }
}
