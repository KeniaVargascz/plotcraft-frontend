import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PrivacySettings } from '../../../core/models/privacy-settings.model';
import { NotificationPreferences } from '../../../core/models/notification-preferences.model';
import { SettingsService } from '../../../core/services/settings.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UserService } from '../../../core/services/user.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmNewPassword = control.get('confirmNewPassword')?.value;

  return newPassword && confirmNewPassword && newPassword !== confirmNewPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
})
export class AccountSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly settingsService = inject(SettingsService);
  readonly themeService = inject(ThemeService);

  private readonly privacyDebounce$ = new Subject<Partial<PrivacySettings>>();

  showEmailCurrentPw = false;
  showUsernameCurrentPw = false;
  showPwCurrent = false;
  showPwNew = false;
  showPwConfirm = false;

  readonly emailSaving = signal(false);
  readonly usernameSaving = signal(false);
  readonly passwordSaving = signal(false);
  readonly emailStatus = signal('');
  readonly usernameStatus = signal('');
  readonly passwordStatus = signal('');
  readonly emailError = signal('');
  readonly usernameError = signal('');
  readonly passwordError = signal('');

  readonly privacy = signal<PrivacySettings>({
    showReadingActivity: true,
    showReadingLists: true,
    showFollows: true,
    showStats: true,
    allowMessages: true,
    searchable: true,
  });
  readonly notifPrefs = signal<NotificationPreferences>({
    newFollower: true,
    newCommentOnPost: true,
    newReactionOnPost: true,
    newReplyInThread: true,
    newChapterFromFollowed: true,
    novelMilestone: true,
    channel: 'IN_APP',
  });
  readonly exportLoading = signal(false);
  readonly privacyLoading = signal(false);
  readonly notifLoading = signal(false);

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    currentPassword: ['', [Validators.required]],
  });

  readonly usernameForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.-]{3,30}$/)]],
    currentPassword: ['', [Validators.required]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/),
        ],
      ],
      confirmNewPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  ngOnInit(): void {
    this.loadPrivacy();
    this.loadNotificationPrefs();
    this.privacyDebounce$.pipe(debounceTime(500)).subscribe((patch) => {
      this.settingsService.updatePrivacy(patch).subscribe({
        next: (res) => this.privacy.set(res),
      });
    });
  }

  loadPrivacy(): void {
    this.privacyLoading.set(true);
    this.settingsService.getPrivacy().subscribe({
      next: (res) => {
        this.privacy.set(res);
        this.privacyLoading.set(false);
      },
      error: () => this.privacyLoading.set(false),
    });
  }

  loadNotificationPrefs(): void {
    this.notifLoading.set(true);
    this.settingsService.getNotificationPrefs().subscribe({
      next: (res) => {
        this.notifPrefs.set(res);
        this.notifLoading.set(false);
      },
      error: () => this.notifLoading.set(false),
    });
  }

  updatePrivacyField(field: keyof PrivacySettings, value: boolean): void {
    this.privacy.update((p) => ({ ...p, [field]: value }));
    this.privacyDebounce$.next({ [field]: value });
  }

  updateNotifField(field: keyof NotificationPreferences, value: boolean): void {
    this.notifPrefs.update((p) => ({ ...p, [field]: value }));
    this.settingsService.updateNotificationPrefs({ [field]: value }).subscribe({
      next: (res) => this.notifPrefs.set(res),
    });
  }

  exportData(): void {
    if (this.exportLoading()) return;
    this.exportLoading.set(true);
    this.settingsService.exportData().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plotcraft-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportLoading.set(false);
      },
      error: () => this.exportLoading.set(false),
    });
  }

  submitEmail(): void {
    if (this.emailForm.invalid || this.emailSaving()) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.emailSaving.set(true);
    this.emailStatus.set('Actualizando email...');
    this.emailError.set('');
    const { email, currentPassword } = this.emailForm.getRawValue();

    this.userService.updateAccount({ email, currentPassword }).subscribe({
      next: () => {
        this.emailSaving.set(false);
        this.emailStatus.set('Email actualizado correctamente.');
      },
      error: () => {
        this.emailSaving.set(false);
        this.emailStatus.set('');
        this.emailError.set('No se pudo actualizar el email. Intenta de nuevo.');
      },
    });
  }

  submitUsername(): void {
    if (this.usernameForm.invalid || this.usernameSaving()) {
      this.usernameForm.markAllAsTouched();
      return;
    }

    this.usernameSaving.set(true);
    this.usernameStatus.set('Actualizando username...');
    this.usernameError.set('');
    const { username, currentPassword } = this.usernameForm.getRawValue();

    this.userService.updateAccount({ username, currentPassword }).subscribe({
      next: () => {
        this.usernameSaving.set(false);
        this.usernameStatus.set('Username actualizado correctamente.');
      },
      error: () => {
        this.usernameSaving.set(false);
        this.usernameStatus.set('');
        this.usernameError.set('No se pudo actualizar el username. Intenta de nuevo.');
      },
    });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid || this.passwordSaving()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordSaving.set(true);
    this.passwordStatus.set('Actualizando contrasena...');
    this.passwordError.set('');
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.userService.updateAccount({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordStatus.set('Contraseña actualizada correctamente.');
        this.passwordForm.reset();
      },
      error: (error: unknown) => {
        this.passwordSaving.set(false);
        this.passwordStatus.set('');
        this.passwordError.set(this.extractErrorMessage(error));
      },
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo actualizar la contraseña. Intenta de nuevo.';
    }

    const message = error.error?.error?.message ?? error.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      const firstMessage = message.find(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      );
      if (firstMessage) {
        return firstMessage;
      }
    }

    return 'No se pudo actualizar la contraseña. Intenta de nuevo.';
  }
}
