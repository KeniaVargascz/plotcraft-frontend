import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './auth.service';
import { LoginPromptDialogComponent } from '../../shared/components/login-prompt-dialog/login-prompt-dialog.component';

@Injectable({ providedIn: 'root' })
export class AuthGateService {
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  /** Navigates if authenticated, otherwise opens login prompt dialog. */
  navigate(route: string[]): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(route);
      return;
    }

    const ref = this.dialog.open(LoginPromptDialogComponent, {
      width: '420px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result === 'login') this.router.navigateByUrl('/login');
      if (result === 'register') this.router.navigateByUrl('/register');
    });
  }
}
