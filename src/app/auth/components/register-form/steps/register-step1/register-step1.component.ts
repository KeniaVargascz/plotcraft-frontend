import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, EventEmitter, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { PasswordStrengthIndicatorComponent } from '../../../../shared/password-strength-indicator/password-strength-indicator.component';
import { confirmPasswordValidator } from '../../../../validators/confirm-password.validator';
import { minimumAgeValidator } from '../../../../validators/minimum-age.validator';
import { nicknameFormatValidator } from '../../../../validators/nickname-format.validator';
import { passwordStrengthValidator } from '../../../../validators/password-strength.validator';
import { usernameFormatValidator } from '../../../../validators/username-format.validator';
import { getFirstError } from '../../../../utils/form-errors.util';
import { environment } from '../../../../../../environments/environment';
import { RegisterStep1Payload } from '../../register-form.component';

@Component({
  selector: 'app-register-step1',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, PasswordStrengthIndicatorComponent],
  templateUrl: './register-step1.component.html',
  styleUrl: './register-step1.component.scss',
})
export class RegisterStep1Component {
  @Output() submitted = new EventEmitter<RegisterStep1Payload>();

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly serverError = signal('');
  readonly getFirstError = getFirstError;
  showPassword = false;
  showConfirmPassword = false;

  readonly form = this.fb.nonNullable.group(
    {
      nickname: ['', [Validators.required, Validators.maxLength(50), nicknameFormatValidator()]],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          usernameFormatValidator(),
        ],
      ],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
      confirmPassword: ['', Validators.required],
      birthdate: [''],
      acceptTerms: [false, Validators.requiredTrue],
    },
    {
      validators: [confirmPasswordValidator(), minimumAgeValidator(13)],
    },
  );

  readonly nicknameErrors: Record<string, string> = {
    required: 'auth.register.error.nickname.required',
    maxlength: 'auth.register.error.nickname.maxlength',
    nicknameFormat: 'auth.register.error.nickname.format',
  };

  readonly usernameErrors: Record<string, string> = {
    required: 'auth.register.error.username.required',
    minlength: 'auth.register.error.username.minlength',
    maxlength: 'auth.register.error.username.maxlength',
    usernameFormat: 'auth.register.error.username.format',
    usernameTaken: 'auth.register.error.username.taken',
  };

  readonly emailErrors: Record<string, string> = {
    required: 'auth.register.error.email.required',
    email: 'auth.register.error.email.invalid',
    emailTaken: 'auth.register.error.email.taken',
  };

  readonly passwordErrors: Record<string, string> = {
    required: 'auth.register.error.password.required',
    minlength: 'auth.register.error.password.minlength',
    passwordStrength: 'auth.register.error.password.strength',
  };

  readonly confirmPasswordErrors: Record<string, string> = {
    required: 'auth.register.error.confirmPassword.required',
  };

  constructor() {
    this.form
      .get('password')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.get('confirmPassword')!.updateValueAndValidity();
      });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.pending || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.serverError.set('');

    const { nickname, username, email, password, birthdate, acceptTerms } = this.form.getRawValue();
    const payload = {
      nickname,
      username,
      email,
      password,
      birthdate: birthdate || null,
      acceptTerms,
    };

    this.http.post(`${environment.apiUrl}/auth/register/initiate`, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitted.emit(payload);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.status === 409) {
          const msg = (err.error?.message ?? '').toLowerCase();
          if (msg.includes('username')) {
            this.form.get('username')!.setErrors({ usernameTaken: true });
          }
          if (msg.includes('email')) {
            this.form.get('email')!.setErrors({ emailTaken: true });
          }
          return;
        }
        this.serverError.set('auth.errors.generic');
      },
    });
  }
}
