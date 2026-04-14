import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login-prompt-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-body">
      <span class="brand">PlotCraft</span>
      <h2>Inicia sesion para continuar</h2>
      <p>Para ver los detalles necesitas una cuenta en PlotCraft.</p>
    </div>
    <mat-dialog-actions align="center">
      <button mat-button [mat-dialog-close]="'register'">Crear cuenta</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="'login'">Iniciar sesion</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .dialog-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
        padding: 2rem 1.5rem 0.5rem;
        text-align: center;
      }

      .brand {
        font-family: 'Playfair Display', serif;
        font-size: 1.8rem;
        color: var(--text-1);
      }

      h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--text-1);
      }

      p {
        margin: 0;
        color: var(--text-2);
        font-size: 0.9rem;
        line-height: 1.5;
      }

      mat-dialog-actions {
        padding: 1rem 1.5rem 1.5rem;
        gap: 0.75rem;
      }
    `,
  ],
})
export class LoginPromptDialogComponent {
  readonly data = inject<{ entityType?: string }>(MAT_DIALOG_DATA, { optional: true });
}
