import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authenticatedMatchGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};

export const anonymousMatchGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  return !authService.isAuthenticated();
};
