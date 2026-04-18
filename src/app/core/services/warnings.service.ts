import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogWarningItem } from '../models/warning.model';

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class WarningsService {
  private readonly http = inject(HttpClient);

  list(): Observable<CatalogWarningItem[]> {
    return this.http
      .get<ApiResponse<CatalogWarningItem[]>>(`${environment.apiUrl}/warnings`)
      .pipe(map((res) => res.data));
  }
}
