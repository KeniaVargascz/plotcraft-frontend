import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface SuggestCharacterDialogData {
  communityName: string;
  initial?: { name: string; description?: string | null; avatarUrl?: string | null };
  mode?: 'suggest' | 'create' | 'edit';
}

export interface SuggestCharacterDialogResult {
  name: string;
  description?: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-suggest-character-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>
      @if (mode === 'edit') {
        Editar personaje
      } @else if (mode === 'create') {
        Nuevo personaje del catálogo
      } @else {
        Sugerir personaje
      }
    </h2>
    <div mat-dialog-content class="form">
      <label>
        Nombre
        <input type="text" [(ngModel)]="name" maxlength="200" placeholder="Nombre del personaje" />
      </label>
      <label>
        Descripción
        <textarea
          [(ngModel)]="description"
          rows="4"
          maxlength="1000"
          placeholder="Una breve descripción..."
        ></textarea>
      </label>
      <label>
        URL del avatar
        <input type="text" [(ngModel)]="avatarUrl" placeholder="https://..." />
      </label>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </div>
    <div mat-dialog-actions align="end">
      <button type="button" (click)="cancel()">Cancelar</button>
      <button type="button" class="primary" [disabled]="!name.trim()" (click)="confirm()">
        @if (mode === 'edit') {
          Guardar
        } @else if (mode === 'create') {
          Crear
        } @else {
          Sugerir
        }
      </button>
    </div>
  `,
  styles: [
    `
      .form {
        display: grid;
        gap: 0.75rem;
        min-width: 320px;
      }
      label {
        display: grid;
        gap: 0.3rem;
        font-size: 0.85rem;
        color: var(--text-2);
      }
      input,
      textarea {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-1);
        border-radius: 0.6rem;
        padding: 0.55rem 0.7rem;
      }
      .error {
        color: #ff8b8b;
        font-size: 0.8rem;
        margin: 0;
      }
      [mat-dialog-actions] button {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-1);
        border-radius: 0.6rem;
        padding: 0.5rem 0.85rem;
        cursor: pointer;
      }
      [mat-dialog-actions] .primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestCharacterDialogComponent {
  name = '';
  description = '';
  avatarUrl = '';
  mode: 'suggest' | 'create' | 'edit';
  readonly error = signal<string | null>(null);

  constructor(
    private readonly ref: MatDialogRef<
      SuggestCharacterDialogComponent,
      SuggestCharacterDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) public data: SuggestCharacterDialogData,
  ) {
    this.mode = data.mode ?? 'suggest';
    if (data.initial) {
      this.name = data.initial.name ?? '';
      this.description = data.initial.description ?? '';
      this.avatarUrl = data.initial.avatarUrl ?? '';
    }
  }

  cancel(): void {
    this.ref.close();
  }

  confirm(): void {
    const trimmed = this.name.trim();
    if (!trimmed) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    this.ref.close({
      name: trimmed,
      description: this.description.trim() || undefined,
      avatarUrl: this.avatarUrl.trim() || undefined,
    });
  }
}
