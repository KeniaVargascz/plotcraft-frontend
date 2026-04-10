import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    PasswordStrengthComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-zA-Z0-9_.-]{3,30}$/),
        ],
      ],
      password: [
        '',
        [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_PATTERN)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.errorMessage.set('');
      this.form.controls.email.setErrors(
        this.removeCustomError(this.form.controls.email.errors, 'taken'),
      );
      this.form.controls.username.setErrors(
        this.removeCustomError(this.form.controls.username.errors, 'taken'),
      );
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, username, password } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register({ email, username, password }).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/mi-perfil');
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.applyErrorState(error);
      },
    });
  }

  private applyErrorState(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorMessage.set('auth.errors.generic');
      return;
    }

    if (error.status === 409) {
      const rawMessage = this.extractMessage(error).toLowerCase();

      if (rawMessage.includes('email')) {
        this.form.controls.email.setErrors({
          ...(this.form.controls.email.errors ?? {}),
          taken: true,
        });
      }

      if (rawMessage.includes('username')) {
        this.form.controls.username.setErrors({
          ...(this.form.controls.username.errors ?? {}),
          taken: true,
        });
      }

      if (!rawMessage.includes('email') && !rawMessage.includes('username')) {
        this.errorMessage.set('auth.errors.duplicate');
      }

      return;
    }

    const message = this.extractMessage(error);
    this.errorMessage.set(message || 'auth.errors.generic');
  }

  private extractMessage(error: HttpErrorResponse): string {
    const message = error.error?.error?.message ?? error.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message) && message.length) {
      const firstMessage = message.find(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      );
      if (firstMessage) {
        return firstMessage;
      }
    }

    return '';
  }

  private removeCustomError(
    errors: ValidationErrors | null | undefined,
    errorKey: string,
  ): ValidationErrors | null {
    if (!errors || !(errorKey in errors)) {
      return errors ?? null;
    }

    const { [errorKey]: _discarded, ...rest } = errors; // eslint-disable-line @typescript-eslint/no-unused-vars
    return Object.keys(rest).length ? rest : null;
  }
}
