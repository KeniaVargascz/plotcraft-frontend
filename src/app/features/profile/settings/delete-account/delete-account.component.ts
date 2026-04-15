import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-delete-account',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './delete-account.component.html',
  styleUrl: './delete-account.component.scss',
})
export class DeleteAccountComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  showPassword = false;

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.userService.deleteAccount(this.form.getRawValue().password).subscribe({
      next: () => {
        this.loading.set(false);
        this.authService.logout();
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
