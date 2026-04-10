import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-reject-character-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Rechazar sugerencia</h2>
    <div mat-dialog-content class="form">
      <label>
        Motivo del rechazo
        <textarea
          [(ngModel)]="note"
          rows="4"
          maxlength="500"
          placeholder="Explica brevemente por qué rechazas esta sugerencia..."
        ></textarea>
      </label>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </div>
    <div mat-dialog-actions align="end">
      <button type="button" (click)="ref.close()">Cancelar</button>
      <button type="button" class="danger" [disabled]="!note.trim()" (click)="confirm()">
        Rechazar
      </button>
    </div>
  `,
  styles: [
    `
      .form {
        display: grid;
        gap: 0.5rem;
        min-width: 320px;
      }
      label {
        display: grid;
        gap: 0.3rem;
        font-size: 0.85rem;
        color: var(--text-2);
      }
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
      [mat-dialog-actions] .danger {
        background: #c0392b;
        color: white;
        border-color: transparent;
      }
    `,
  ],
})
export class RejectCharacterDialogComponent {
  note = '';
  readonly error = signal<string | null>(null);

  constructor(public ref: MatDialogRef<RejectCharacterDialogComponent, string>) {}

  confirm(): void {
    const trimmed = this.note.trim();
    if (!trimmed) {
      this.error.set('Debes indicar un motivo.');
      return;
    }
    this.ref.close(trimmed);
  }
}
