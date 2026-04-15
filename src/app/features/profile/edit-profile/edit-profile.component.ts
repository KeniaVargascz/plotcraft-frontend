import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [MatSnackBarModule, ReactiveFormsModule, RouterLink, TranslatePipe],
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
    avatarUrl: [this.currentUser?.profile?.avatarUrl ?? ''],
    bannerUrl: [this.currentUser?.profile?.bannerUrl ?? ''],
    isPublic: [this.currentUser?.profile?.isPublic ?? true],
  });

  readonly displayNamePreview = computed(() => {
    return this.form.controls.displayName.value.trim() || this.currentUser?.username || 'Tu nombre';
  });

  readonly bioPreview = computed(() => {
    return (
      this.form.controls.bio.value.trim() ||
      'Tu bio aparecera aqui para presentar tu perfil dentro del ecosistema de la app.'
    );
  });

  readonly websitePreview = computed(() => this.form.controls.website.value.trim());
  readonly avatarPreview = computed(() => this.form.controls.avatarUrl.value.trim());
  readonly bannerPreview = computed(() => this.form.controls.bannerUrl.value.trim());
  readonly bioLength = computed(() => this.form.controls.bio.value.length);
  readonly visibilityLabel = computed(() =>
    this.form.controls.isPublic.value ? 'Perfil publico' : 'Perfil privado',
  );
  readonly profileInitial = computed(
    () => this.displayNamePreview().trim().charAt(0).toUpperCase() || 'P',
  );

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

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
