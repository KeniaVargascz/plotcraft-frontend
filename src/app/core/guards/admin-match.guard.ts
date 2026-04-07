import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminMatchGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUserSnapshot();
  if (!user?.isAdmin) {
    return router.createUrlTree(['/']);
  }
  return true;
};
