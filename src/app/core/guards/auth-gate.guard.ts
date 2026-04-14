import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { LoginPromptDialogComponent } from '../../shared/components/login-prompt-dialog/login-prompt-dialog.component';

export const authGateGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const dialog = inject(MatDialog);

  if (auth.isAuthenticated()) return true;

  const ref = dialog.open(LoginPromptDialogComponent, {
    width: '420px',
  });
  ref.afterClosed().subscribe((result) => {
    if (result === 'login') router.navigateByUrl('/login');
    if (result === 'register') router.navigateByUrl('/register');
  });

  // Redirect to the parent catalog instead of /login to keep browsing context
  const segments = state.url.split('/').filter(Boolean);
  const catalog = segments[0] ?? '';
  return router.createUrlTree([`/${catalog}`]);
};
