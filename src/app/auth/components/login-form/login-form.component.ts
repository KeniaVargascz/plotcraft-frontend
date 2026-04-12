import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, OnDestroy, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { getFirstError } from '../../utils/form-errors.util';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent implements OnDestroy {
  @Output() loginSuccess = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly formError = signal('');
  readonly rateLimitCountdown = signal(0);
  readonly getFirstError = getFirstError;
  showPassword = false;

  private rateLimitTimer?: ReturnType<typeof setInterval>;

  readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(254)]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  readonly identifierErrors: Record<string, string> = {
    required: 'auth.login.error.identifier.required',
    minlength: 'auth.login.error.identifier.minlength',
  };

  readonly passwordErrors: Record<string, string> = {
    required: 'auth.login.error.password.required',
  };

  ngOnDestroy(): void {
    if (this.rateLimitTimer) clearInterval(this.rateLimitTimer);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) return;

    const { identifier, password, rememberMe } = this.form.getRawValue();
    const trimmedIdentifier = identifier.trim();

    this.isSubmitting.set(true);
    this.formError.set('');
    this.form.disable();

    this.authService
      .login({ email: trimmedIdentifier, password })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.form.enable();
          this.loginSuccess.emit();
          void this.router.navigateByUrl('/feed');
        },
        error: (err: unknown) => {
          this.isSubmitting.set(false);
          this.form.enable();
          this.handleError(err);
        },
      });
  }

  private handleError(err: unknown): void {
    if (!(err instanceof HttpErrorResponse)) {
      this.formError.set('auth.errors.generic');
      return;
    }

    switch (err.status) {
      case 401:
        this.formError.set('auth.login.error.credentials.invalid');
        break;
      case 403:
        const reason = err.error?.reason ?? '';
        void this.router.navigateByUrl(`/cuenta-suspendida?reason=${encodeURIComponent(reason)}`);
        break;
      case 429: {
        const retryAfter = parseInt(err.headers?.get('Retry-After') ?? '', 10);
        if (retryAfter > 0) {
          this.startRateLimitCountdown(retryAfter);
          this.formError.set('auth.login.error.rateLimit.withTimer');
        } else {
          this.formError.set('auth.login.error.rateLimit');
        }
        break;
      }
      default:
        this.formError.set('auth.errors.generic');
    }
  }

  private startRateLimitCountdown(seconds: number): void {
    this.rateLimitCountdown.set(seconds);
    if (this.rateLimitTimer) clearInterval(this.rateLimitTimer);
    this.rateLimitTimer = setInterval(() => {
      const current = this.rateLimitCountdown();
      if (current <= 1) {
        this.rateLimitCountdown.set(0);
        clearInterval(this.rateLimitTimer);
        this.formError.set('');
      } else {
        this.rateLimitCountdown.set(current - 1);
      }
    }, 1000);
  }
}
