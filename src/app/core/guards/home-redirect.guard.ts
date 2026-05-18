import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureFlagService } from '../services/feature-flag.service';

export const homeRedirectGuard: CanActivateFn = async () => {
  const ff = inject(FeatureFlagService);
  const router = inject(Router);
  await ff.whenReady();
  return router.createUrlTree([ff.getHomeRoute()]);
};
