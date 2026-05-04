import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, timeout, catchError, of } from 'rxjs';
import { HttpApiService } from './http-api.service';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  readonly enabled = signal(false);
  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly api: HttpApiService) {}

  check(): Promise<void> {
    return new Promise((resolve) => {
      this.fetchStatus().subscribe((enabled) => {
        this.enabled.set(enabled);
        resolve();
        this.startPolling();
      });
    });
  }

  private startPolling(): void {
    interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.fetchStatus()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((enabled) => {
        this.enabled.set(enabled);
      });
  }

  private fetchStatus() {
    return this.api
      .get<{ enabled: boolean }>('/features/maintenance')
      .pipe(
        timeout(5000),
        catchError(() => of({ enabled: false })),
      )
      .pipe(
        switchMap((data) => of(data?.enabled ?? false)),
      );
  }
}
