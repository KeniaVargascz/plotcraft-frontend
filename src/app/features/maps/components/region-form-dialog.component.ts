import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MapRegionResponse } from '../../../core/models/map-region.model';

export interface RegionFormData {
  region?: MapRegionResponse;
}

export interface RegionFormResult {
  label: string;
  color: string;
  borderColor: string;
  description: string | null;
}

const BORDER_SWATCHES = [
  '#ffffff', '#c9a84c', '#8b5cf6', '#3db05a', '#e05555',
  '#e09040', '#3080c0', '#ff70a0', '#70ffc0', '#f0f080',
];

@Component({
  selector: 'app-region-form-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.region ? 'Editar region' : 'Nueva region' }}</h2>

    <mat-dialog-content>
      <div class="form-grid">
        <!-- Label -->
        <div class="field">
          <label>Nombre</label>
          <input type="text" [(ngModel)]="label" placeholder="Nombre de la region" />
        </div>

        <!-- Color + opacity -->
        <div class="field">
          <label>Color de relleno</label>
          <div class="color-row">
            <input type="color" [(ngModel)]="fillColor" class="color-input" />
            <input type="text" [(ngModel)]="fillColor" class="hex-input" placeholder="#rrggbb" />
          </div>
        </div>

        <div class="field">
          <label>Opacidad ({{ opacity() }}%)</label>
          <input
            type="range"
            min="0" max="100" step="5"
            [ngModel]="opacity()"
            (ngModelChange)="opacity.set($event)"
          />
        </div>

        <!-- Border Color -->
        <div class="field">
          <label>Color de borde</label>
          <div class="swatches">
            @for (c of borderSwatches; track c) {
              <button
                type="button"
                class="swatch"
                [style.background]="c"
                [class.selected]="borderColor === c"
                (click)="borderColor = c"
              ></button>
            }
          </div>
          <input type="text" [(ngModel)]="borderColor" placeholder="#rrggbb" class="hex-input" />
        </div>

        <!-- Description -->
        <div class="field">
          <label>Descripcion</label>
          <textarea [(ngModel)]="description" rows="3" placeholder="Descripcion opcional"></textarea>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button type="button" class="btn-secondary" (click)="dialogRef.close(null)">Cancelar</button>
      <button type="button" class="btn-primary" [disabled]="!label.trim()" (click)="submit()">
        {{ data.region ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    :host { display: block; width: 420px; }
    .form-grid { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: 0.8rem; color: var(--text-secondary, #aaa); text-transform: uppercase; letter-spacing: 0.04em; }
    input, textarea {
      padding: 8px 10px;
      border: 1px solid var(--border-color, #333);
      border-radius: 6px;
      background: var(--surface-input, #1a1a2a);
      color: var(--text-primary, #eee);
      font-size: 0.9rem;
    }
    input[type="range"] { width: 100%; accent-color: var(--accent, #8b5cf6); }
    .color-row { display: flex; gap: 8px; align-items: center; }
    .color-input { width: 40px; height: 36px; border: none; padding: 0; cursor: pointer; border-radius: 4px; }
    .hex-input { flex: 1; }
    .swatches { display: flex; gap: 6px; flex-wrap: wrap; }
    .swatch {
      width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer;
    }
    .swatch.selected { border-color: #fff; box-shadow: 0 0 0 2px var(--accent, #8b5cf6); }
    .btn-primary, .btn-secondary {
      padding: 8px 18px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; border: none;
    }
    .btn-primary { background: var(--accent, #8b5cf6); color: #fff; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: transparent; color: var(--text-secondary, #aaa); border: 1px solid var(--border-color, #333); }
  `,
})
export class RegionFormDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<RegionFormDialogComponent>);
  readonly data: RegionFormData = inject(MAT_DIALOG_DATA);

  readonly borderSwatches = BORDER_SWATCHES;

  label = '';
  fillColor = '#8b5cf6';
  readonly opacity = signal(30);
  borderColor = '#ffffff';
  description = '';

  ngOnInit(): void {
    const r = this.data.region;
    if (r) {
      this.label = r.label;
      this.borderColor = r.borderColor;
      this.description = r.description ?? '';
      this.parseColor(r.color);
    }
  }

  submit(): void {
    const alpha = Math.round((this.opacity() / 100) * 255)
      .toString(16)
      .padStart(2, '0');
    const result: RegionFormResult = {
      label: this.label.trim(),
      color: this.fillColor + alpha,
      borderColor: this.borderColor,
      description: this.description.trim() || null,
    };
    this.dialogRef.close(result);
  }

  private parseColor(hex: string): void {
    if (hex.length === 9) {
      this.fillColor = hex.slice(0, 7);
      const a = parseInt(hex.slice(7, 9), 16);
      this.opacity.set(Math.round((a / 255) * 100));
    } else {
      this.fillColor = hex;
      this.opacity.set(100);
    }
  }
}
