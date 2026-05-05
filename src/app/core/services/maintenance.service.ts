import { Injectable, signal } from '@angular/core';
import { timeout, catchError, of, map } from 'rxjs';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  readonly enabled = signal(false);

  constructor(private readonly api: HttpApiService) {}

  /** Called once at app startup. Interceptors handle 503 after that. */
  check(): Promise<void> {
    return new Promise((resolve) => {
      this.api
        .get<{ enabled: boolean }>('/features/maintenance')
        .pipe(
          timeout(5000),
          map((data) => data?.enabled ?? false),
          catchError((err) => of(err?.status === 503)),
        )
        .subscribe((active) => {
          this.enabled.set(active);
          resolve();
        });
    });
  }
}
