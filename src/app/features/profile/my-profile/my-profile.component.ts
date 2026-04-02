import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [DatePipe, MatButtonModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss',
})
export class MyProfileComponent {
  private readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly user = signal<User | null>(null);

  constructor() {
    this.authService
      .me()
      .pipe(
        tap((user) => {
          this.user.set(user);
          this.loading.set(false);
        }),
        catchError(() => {
          this.error.set(true);
          this.loading.set(false);
          return of(null);
        }),
      )
      .subscribe();
  }
}
