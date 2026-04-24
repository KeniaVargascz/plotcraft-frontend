import { Injectable, signal, computed } from '@angular/core';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly flags = signal<Set<string>>(new Set());
  private loaded = false;

  constructor(private readonly api: HttpApiService) {}

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    return new Promise((resolve) => {
      this.api.get<string[]>('/features/active').subscribe({
        next: (keys) => {
          this.flags.set(new Set(keys));
          this.loaded = true;
          resolve();
        },
        error: () => {
          // If endpoint fails, enable everything (fail-open)
          this.loaded = true;
          resolve();
        },
      });
    });
  }

  isEnabled(key: string): boolean {
    if (!this.loaded) return true; // fail-open before load
    return this.flags().has(key);
  }

  /** Reactive signal for use in templates */
  enabled(key: string) {
    return computed(() => this.flags().has(key));
  }
}
