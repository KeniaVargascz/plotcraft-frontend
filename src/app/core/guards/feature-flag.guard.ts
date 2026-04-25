import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureFlagService } from '../services/feature-flag.service';

export function featureFlagGuard(featureKey: string): CanActivateFn {
  return async () => {
    const featureFlags = inject(FeatureFlagService);
    const router = inject(Router);
    await featureFlags.whenReady();
    if (featureFlags.isEnabled(featureKey)) return true;
    return router.createUrlTree(['/']);
  };
}
