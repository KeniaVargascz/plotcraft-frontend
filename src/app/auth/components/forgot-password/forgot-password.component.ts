import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { getFirstError } from '../../utils/form-errors.util';
import { AuthService } from '../../../core/services/auth.service';
import { OtpInputComponent } from '../../shared/otp-input/otp-input.component';
import { PasswordStrengthIndicatorComponent } from '../../shared/password-strength-indicator/password-strength-indicator.component';
import { passwordStrengthValidator } from '../../validators/password-strength.validator';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    OtpInputComponent,
    RouterLink,
    PasswordStrengthIndicatorComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  @ViewChild(OtpInputComponent) otpInput!: OtpInputComponent;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<1 | 2>(1);
  readonly isSubmitting = signal(false);
  readonly formError = signal('');
  readonly successMessage = signal('');
  readonly getFirstError = getFirstError;
  showPassword = false;
  showConfirmPassword = false;

  private submittedEmail = '';

  // Step 1 form
  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Step 2 form
  readonly resetForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly otpCode = signal('');

  readonly emailErrors: Record<string, string> = {
    required: 'auth.forgotPassword.error.email.required',
    email: 'auth.forgotPassword.error.email.email',
  };

  readonly newPasswordErrors: Record<string, string> = {
    required: 'auth.resetPassword.error.password.required',
    minlength: 'auth.resetPassword.error.password.minlength',
    passwordStrength: 'auth.resetPassword.error.password.strength',
  };

  readonly confirmPasswordErrors: Record<string, string> = {
    required: 'auth.resetPassword.error.password.required',
    mismatch: 'auth.resetPassword.error.password.mismatch',
  };

  get maskedEmail(): string {
    return this.maskEmail(this.submittedEmail);
  }

  onOtpCompleted(code: string): void {
    this.otpCode.set(code);
  }

  onOtpCleared(): void {
    this.otpCode.set('');
  }

  submitEmail(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid || this.isSubmitting()) return;

    const { email } = this.emailForm.getRawValue();
    this.submittedEmail = email.trim();

    this.isSubmitting.set(true);
    this.formError.set('');
    this.emailForm.disable();

    this.authService.forgotPassword(this.submittedEmail).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.emailForm.enable();
        this.step.set(2);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.emailForm.enable();
        this.formError.set('auth.errors.generic');
      },
    });
  }

  submitReset(): void {
    this.resetForm.markAllAsTouched();

    // Check password match
    const { newPassword, confirmPassword } = this.resetForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.resetForm.controls.confirmPassword.setErrors({ mismatch: true });
    }

    const code = this.otpCode();
    if (code.length !== 6 || this.resetForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.formError.set('');
    this.resetForm.disable();

    this.authService.resetPassword({ email: this.submittedEmail, code, newPassword }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.resetForm.enable();
        void this.router.navigateByUrl('/login');
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.resetForm.enable();
        this.handleResetError(err);
      },
    });
  }

  private handleResetError(err: unknown): void {
    if (!(err instanceof HttpErrorResponse)) {
      this.formError.set('auth.errors.generic');
      return;
    }

    switch (err.status) {
      case 400:
        this.formError.set('auth.resetPassword.error.code.invalid');
        this.otpInput?.clear();
        break;
      case 410:
        this.formError.set('auth.resetPassword.error.code.expired');
        break;
      case 429:
        this.formError.set('auth.resetPassword.error.code.tooManyAttempts');
        break;
      default:
        this.formError.set('auth.errors.generic');
    }
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const visible = local.length <= 2 ? local : local[0] + '***' + local[local.length - 1];
    return `${visible}@${domain}`;
  }
}
