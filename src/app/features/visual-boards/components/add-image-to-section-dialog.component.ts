import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { catchError, finalize, of } from 'rxjs';
import { MediaService } from '../../../core/services/media.service';

export interface AddImageToSectionDialogData {
  sectionTitle: string;
}

export interface AddImageToSectionResult {
  imageUrl: string;
  caption: string | null;
}

@Component({
  selector: 'app-add-image-to-section-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Añadir imagen</h2>
    <mat-dialog-content>
      <div class="form">
        <p class="hint">Seccion: {{ data.sectionTitle }}</p>

        <label class="file-upload">
          <span>Selecciona una imagen</span>
          <input type="file" accept="image/*" (change)="onFileSelected($event)" />
        </label>

        <label>
          <span>O pega una URL</span>
          <input [(ngModel)]="imageUrl" placeholder="https://..." />
        </label>

        @if (uploading()) {
          <p class="hint">Subiendo imagen...</p>
        } @else if (error()) {
          <p class="error">{{ error() }}</p>
        }

        @if (imageUrl.trim()) {
          <div class="preview"><img [src]="imageUrl.trim()" alt="Vista previa" /></div>
        }

        <label>
          <span>Pie de foto</span>
          <input [(ngModel)]="caption" maxlength="300" />
        </label>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!imageUrl.trim() || uploading()"
        (click)="submit()"
      >
        Añadir imagen
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        min-width: min(30rem, 78vw);
        display: grid;
        gap: 0.9rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
      }
      input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.7rem 0.8rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .hint,
      .error {
        margin: 0;
        font-size: 0.82rem;
      }
      .hint {
        color: var(--text-2);
      }
      .error {
        color: #b42318;
      }
      .preview {
        overflow: hidden;
        border-radius: 0.9rem;
        border: 1px solid var(--border);
      }
      .preview img {
        display: block;
        width: 100%;
        max-height: 16rem;
        object-fit: cover;
      }
    `,
  ],
})
export class AddImageToSectionDialogComponent {
  readonly data = inject<AddImageToSectionDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(
    MatDialogRef<AddImageToSectionDialogComponent, AddImageToSectionResult | null>,
  );
  private readonly mediaService = inject(MediaService);

  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  imageUrl = '';
  caption = '';

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.error.set(null);
    this.uploading.set(true);
    this.mediaService
      .upload(file, 'visual_ref')
      .pipe(
        catchError(() => {
          this.error.set(
            'No se pudo subir la imagen con /media/upload. Puedes pegar una URL manualmente.',
          );
          return of(null);
        }),
        finalize(() => this.uploading.set(false)),
      )
      .subscribe((url) => {
        if (url) this.imageUrl = url;
      });
  }

  submit() {
    if (!this.imageUrl.trim()) return;
    this.dialogRef.close({
      imageUrl: this.imageUrl.trim(),
      caption: this.caption.trim() || null,
    });
  }
}
