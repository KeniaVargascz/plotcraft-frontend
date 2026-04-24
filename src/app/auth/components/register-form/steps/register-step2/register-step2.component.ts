import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, Input, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { OtpInputComponent } from '../../../../shared/otp-input/otp-input.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-register-step2',
  standalone: true,
  imports: [OtpInputComponent, TranslatePipe],
  templateUrl: './register-step2.component.html',
  styleUrl: './register-step2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterStep2Component implements OnInit, OnDestroy {
  @Input({ required: true }) email = '';
  @ViewChild(OtpInputComponent) otpInput!: OtpInputComponent;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly isVerifying = signal(false);
  readonly errorMessage = signal('');
  readonly formDisabled = signal(false);
  readonly otpCode = signal('');
  readonly resendCooldown = signal(0);

  private resendInterval?: ReturnType<typeof setInterval>;

  get maskedEmail(): string {
    return this.maskEmail(this.email);
  }

  ngOnInit(): void {
    this.startResendCooldown();
  }

  ngOnDestroy(): void {
    if (this.resendInterval) clearInterval(this.resendInterval);
  }

  onOtpCompleted(code: string): void {
    this.otpCode.set(code);
  }

  onOtpCleared(): void {
    this.otpCode.set('');
  }

  verify(): void {
    const code = this.otpCode();
    if (code.length !== 6 || this.isVerifying()) return;

    this.isVerifying.set(true);
    this.errorMessage.set('');

    this.authService.verifyRegistration({ email: this.email, code }).subscribe({
      next: () => {
        this.isVerifying.set(false);
        void this.router.navigateByUrl('/feed');
      },
      error: (err: HttpErrorResponse) => {
        this.isVerifying.set(false);
        this.handleVerifyError(err);
      },
    });
  }

  resend(): void {
    if (this.resendCooldown() > 0) return;

    this.authService.resendOtp(this.email).subscribe({
      next: () => this.startResendCooldown(),
      error: () => this.errorMessage.set('auth.errors.generic'),
    });
  }

  private handleVerifyError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 400:
        this.errorMessage.set('auth.verify.error.code.invalid');
        this.otpInput?.clear();
        break;
      case 410:
        this.errorMessage.set('auth.verify.error.code.expired');
        this.resendCooldown.set(0);
        if (this.resendInterval) clearInterval(this.resendInterval);
        break;
      case 429:
        this.errorMessage.set('auth.verify.error.tooManyAttempts');
        this.formDisabled.set(true);
        break;
      default:
        this.errorMessage.set('auth.errors.generic');
    }
  }

  private startResendCooldown(seconds = 60): void {
    this.resendCooldown.set(seconds);
    if (this.resendInterval) clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        clearInterval(this.resendInterval);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const visible = local.length <= 2 ? local : local[0] + '***' + local[local.length - 1];
    return `${visible}@${domain}`;
  }
}
