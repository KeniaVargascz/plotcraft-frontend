import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
})
export class AccountSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  readonly emailSaving = signal(false);
  readonly usernameSaving = signal(false);
  readonly passwordSaving = signal(false);
  readonly emailStatus = signal('');
  readonly usernameStatus = signal('');
  readonly passwordStatus = signal('');
  readonly emailError = signal('');
  readonly usernameError = signal('');
  readonly passwordError = signal('');

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    currentPassword: ['', [Validators.required]],
  });

  readonly usernameForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.-]{3,30}$/)]],
    currentPassword: ['', [Validators.required]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: [
      '',
      [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)],
    ],
    confirmNewPassword: ['', [Validators.required]],
  });

  submitEmail(): void {
    if (this.emailForm.invalid || this.emailSaving()) {
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
      return;
    }

    this.passwordSaving.set(true);
    this.passwordStatus.set('Actualizando contrasena...');
    this.passwordError.set('');
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.userService.updateAccount({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordStatus.set('Contrasena actualizada correctamente.');
      },
      error: () => {
        this.passwordSaving.set(false);
        this.passwordStatus.set('');
        this.passwordError.set('No se pudo actualizar la contrasena. Intenta de nuevo.');
      },
    });
  }
}
