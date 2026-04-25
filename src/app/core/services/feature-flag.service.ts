import { Injectable, signal, computed } from '@angular/core';
import { timeout, catchError, of } from 'rxjs';
import { HttpApiService } from './http-api.service';

const LOAD_TIMEOUT_MS = 5000;

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly flags = signal<Set<string>>(new Set());
  private readonly ready = signal(false);
  private loadPromise: Promise<void> | null = null;

  constructor(private readonly api: HttpApiService) {}

  load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = new Promise((resolve) => {
      this.api
        .get<string[]>('/features/active')
        .pipe(
          timeout(LOAD_TIMEOUT_MS),
          catchError(() => of(null)),
        )
        .subscribe((keys) => {
          if (keys) {
            this.flags.set(new Set(keys));
          }
          // null = timeout or error → fail-open (empty flags = everything enabled)
          this.ready.set(true);
          resolve();
        });
    });
    return this.loadPromise;
  }

  /** Wait until flags are loaded, then check. Use in async guards. */
  async whenReady(): Promise<void> {
    if (this.ready()) return;
    await this.load();
  }

  isEnabled(key: string): boolean {
    if (!this.ready()) return true; // fail-open before load
    return this.flags().has(key);
  }

  /** Reactive signal for use in templates — cached per key */
  private readonly enabledCache = new Map<string, ReturnType<typeof computed<boolean>>>();

  enabled(key: string) {
    let c = this.enabledCache.get(key);
    if (!c) {
      c = computed(() => {
        if (!this.ready()) return true; // fail-open before load
        return this.flags().has(key);
      });
      this.enabledCache.set(key, c);
    }
    return c;
  }
}
