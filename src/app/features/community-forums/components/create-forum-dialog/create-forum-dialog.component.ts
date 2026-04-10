import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommunityForumsService } from '../../services/community-forums.service';
import { CommunityForum } from '../../models/community-forum.model';

@Component({
  selector: 'app-create-forum-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Crear foro</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="content">
        <label class="field">
          <span>Nombre del foro</span>
          <input type="text" formControlName="name" maxlength="200" required />
        </label>
        <label class="field">
          <span>Descripción</span>
          <textarea formControlName="description" rows="3" maxlength="500"></textarea>
        </label>
        <label class="toggle">
          <input type="checkbox" formControlName="isPrivate" />
          <span>Foro privado (solo miembros de la comunidad)</span>
        </label>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </div>
      <div mat-dialog-actions align="end">
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Creando...' : 'Crear foro' }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .content {
        display: grid;
        gap: 0.85rem;
        min-width: 320px;
      }
      .field {
        display: grid;
        gap: 0.3rem;
      }
      .field input,
      .field textarea {
        padding: 0.6rem 0.75rem;
        border-radius: 0.65rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-family: inherit;
      }
      .toggle {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        color: var(--text-2);
      }
      .error {
        color: var(--danger, #e49d9d);
        font-size: 0.85rem;
        margin: 0;
      }
      button {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
      }
      button.primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
        font-weight: 600;
      }
      button[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CreateForumDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CommunityForumsService);
  private readonly dialogRef = inject(MatDialogRef<CreateForumDialogComponent, CommunityForum>);
  readonly data = inject<{ communitySlug: string }>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(500)]],
    isPrivate: [false],
  });

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  cancel() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.service
      .createForum(this.data.communitySlug, {
        name: v.name.trim(),
        description: v.description?.trim() || undefined,
        isPublic: !v.isPrivate,
      })
      .subscribe({
        next: (forum) => {
          this.saving.set(false);
          this.dialogRef.close(forum);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo crear el foro.');
        },
      });
  }
}
