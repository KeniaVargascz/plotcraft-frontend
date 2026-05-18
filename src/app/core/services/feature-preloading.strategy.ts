import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { FeatureFlagService } from './feature-flag.service';
import { FEATURE_FLAG_GUARD_KEY } from '../guards/feature-flag.guard';
import type { FeatureFlagKey } from '../constants/feature-flags.constants';

@Injectable({ providedIn: 'root' })
export class FeaturePreloadingStrategy implements PreloadingStrategy {
  private readonly ff = inject(FeatureFlagService);

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const featureKey = this.extractFeatureKey(route);

    if (featureKey && !this.ff.isEnabled(featureKey)) {
      return of(null);
    }

    return load();
  }

  private extractFeatureKey(route: Route): FeatureFlagKey | null {
    const guards = route.canActivate ?? [];
    for (const guard of guards) {
      const key = (guard as any)?.[FEATURE_FLAG_GUARD_KEY];
      if (key) return key as FeatureFlagKey;
    }
    return null;
  }
}
