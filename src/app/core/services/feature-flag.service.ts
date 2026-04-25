import { Injectable, signal, computed } from '@angular/core';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly flags = signal<Set<string>>(new Set());
  private readonly ready = signal(false);
  private loadPromise: Promise<void> | null = null;

  constructor(private readonly api: HttpApiService) {}

  load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = new Promise((resolve) => {
      this.api.get<string[]>('/features/active').subscribe({
        next: (keys) => {
          this.flags.set(new Set(keys));
          this.ready.set(true);
          resolve();
        },
        error: () => {
          // If endpoint fails, enable everything (fail-open)
          this.ready.set(true);
          resolve();
        },
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

  /** Reactive signal for use in templates */
  enabled(key: string) {
    return computed(() => {
      if (!this.ready()) return true; // fail-open before load
      return this.flags().has(key);
    });
  }
}
