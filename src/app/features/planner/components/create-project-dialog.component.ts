import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NovelSummary } from '../../../core/models/novel.model';
import { NovelsService } from '../../../core/services/novels.service';

const COLOR_SWATCHES = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#64748b',
  '#f97316',
];

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Nuevo proyecto</h2>

    <mat-dialog-content>
      <div class="form-grid">
        <label class="field">
          <span class="field-label">Nombre del proyecto *</span>
          <input type="text" [(ngModel)]="name" placeholder="Mi proyecto de escritura" />
        </label>

        <label class="field">
          <span class="field-label">Descripcion</span>
          <textarea
            [(ngModel)]="description"
            rows="2"
            placeholder="Descripcion opcional"
          ></textarea>
        </label>

        <div class="field">
          <span class="field-label">Color</span>
          <div class="swatches">
            @for (c of colors; track c) {
              <button
                class="swatch"
                [class.selected]="color === c"
                [style.background]="c"
                (click)="color = c"
              ></button>
            }
          </div>
        </div>

        <label class="field">
          <span class="field-label">Novela asociada (opcional)</span>
          <select [(ngModel)]="novelId">
            <option value="">Sin novela</option>
            @for (n of novels(); track n.id) {
              <option [value]="n.id">{{ n.title }}</option>
            }
          </select>
        </label>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button class="btn-cancel" (click)="onCancel()">Cancelar</button>
      <button class="btn-save" [disabled]="!name.trim()" (click)="onSave()">Crear proyecto</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(460px, 90vw);
      }
      h2[mat-dialog-title] {
        color: var(--text-1);
        font-size: 1.15rem;
        margin: 0;
        padding: 1rem 1.25rem 0.5rem;
      }
      mat-dialog-content {
        padding: 0 1.25rem;
      }
      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        padding-bottom: 0.5rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .field-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-2);
      }
      input,
      textarea,
      select {
        background: var(--bg-base);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.5rem 0.625rem;
        font-size: 0.85rem;
        color: var(--text-1);
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s;
      }
      input:focus,
      textarea:focus,
      select:focus {
        border-color: var(--accent);
      }
      textarea {
        resize: vertical;
      }
      .swatches {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .swatch {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: 2px solid transparent;
        cursor: pointer;
        transition:
          transform 0.15s,
          border-color 0.15s;
      }
      .swatch:hover {
        transform: scale(1.15);
      }
      .swatch.selected {
        border-color: var(--text-1);
        box-shadow: 0 0 0 2px var(--bg-card);
      }
      mat-dialog-actions {
        padding: 0.75rem 1.25rem;
        gap: 0.5rem;
      }
      .btn-cancel {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
        color: var(--text-2);
        cursor: pointer;
      }
      .btn-cancel:hover {
        border-color: var(--border-s);
      }
      .btn-save {
        background: var(--accent);
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1.25rem;
        font-size: 0.85rem;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        transition: filter 0.15s;
      }
      .btn-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-save:hover:not(:disabled) {
        filter: brightness(1.15);
      }
    `,
  ],
})
export class CreateProjectDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CreateProjectDialogComponent>);
  private readonly novelsService = inject(NovelsService);

  colors = COLOR_SWATCHES;
  novels = signal<NovelSummary[]>([]);

  name = '';
  description = '';
  color = COLOR_SWATCHES[0];
  novelId = '';

  ngOnInit(): void {
    this.novelsService.listMine({ limit: 50 }).subscribe({
      next: (res) => this.novels.set(res.data),
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    this.dialogRef.close({
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      color: this.color,
      novelId: this.novelId || undefined,
    });
  }
}
