import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss',
})
export class EditProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  private readonly currentUser = this.authService.getCurrentUserSnapshot();

  readonly form = this.fb.nonNullable.group({
    displayName: [this.currentUser?.profile?.displayName ?? '', [Validators.maxLength(80)]],
    bio: [this.currentUser?.profile?.bio ?? '', [Validators.maxLength(500)]],
    website: [this.currentUser?.profile?.website ?? ''],
    isPublic: [this.currentUser?.profile?.isPublic ?? true],
  });

  submit(): void {
    this.loading.set(true);

    this.userService.updateProfile(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open('Cambios guardados correctamente', 'OK', { duration: 2500 });
        void this.router.navigateByUrl('/mi-perfil');
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
