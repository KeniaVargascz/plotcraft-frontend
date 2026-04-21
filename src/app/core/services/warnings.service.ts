import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogWarningItem } from '../models/warning.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class WarningsService {
  private readonly api = inject(HttpApiService);

  list(): Observable<CatalogWarningItem[]> {
    return this.api.get<CatalogWarningItem[]>('/warnings');
  }
}
