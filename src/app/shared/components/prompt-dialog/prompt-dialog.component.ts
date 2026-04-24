import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface PromptDialogData {
  title: string;
  label: string;
  placeholder?: string;
  value?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <label class="prompt-label">
        <span>{{ data.label }}</span>
        <input
          type="text"
          [(ngModel)]="value"
          [placeholder]="data.placeholder || ''"
          (keydown.enter)="submit()"
          class="prompt-input"
          #inputEl
        />
      </label>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">
        {{ data.cancelText || 'Cancelar' }}
      </button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="!value.trim()">
        {{ data.confirmText || 'Aceptar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .prompt-label {
        display: grid;
        gap: 0.4rem;
        width: 100%;
      }
      .prompt-label span {
        font-size: 0.85rem;
        color: var(--text-2, #666);
      }
      .prompt-input {
        width: 100%;
        padding: 0.65rem 0.8rem;
        border-radius: 0.65rem;
        border: 1px solid var(--border, #ddd);
        background: var(--bg-surface, #fff);
        color: var(--text-1, #222);
        font-size: 0.85rem;
        box-sizing: border-box;
      }
      .prompt-input:focus {
        outline: 1px solid var(--accent-glow, #6366f1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptDialogComponent {
  readonly data = inject<PromptDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<PromptDialogComponent>);
  value = this.data.value || '';

  submit() {
    if (this.value.trim()) {
      this.dialogRef.close(this.value.trim());
    }
  }
}
