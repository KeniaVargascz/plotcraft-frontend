import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureFlagService } from '../services/feature-flag.service';
import type { FeatureFlagKey } from '../constants/feature-flags.constants';

export const FEATURE_FLAG_GUARD_KEY = '__featureFlagKey';

export function featureFlagGuard(featureKey: FeatureFlagKey): CanActivateFn {
  const guard: CanActivateFn = async () => {
    const featureFlags = inject(FeatureFlagService);
    const router = inject(Router);
    await featureFlags.whenReady();
    if (featureFlags.isEnabled(featureKey)) return true;
    return router.createUrlTree([featureFlags.getHomeRoute()]);
  };
  (guard as any)[FEATURE_FLAG_GUARD_KEY] = featureKey;
  return guard;
}
