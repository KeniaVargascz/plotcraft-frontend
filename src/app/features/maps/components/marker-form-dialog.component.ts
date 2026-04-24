import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MarkerType, MapMarkerResponse } from '../../../core/models/map-marker.model';
import { WorldLocation } from '../../../core/models/world.model';
import { WbEntrySummary } from '../../../core/models/wb-entry.model';
import { MarkerTypeIconComponent } from './marker-type-icon.component';

export interface MarkerFormData {
  marker?: MapMarkerResponse;
  locations: WorldLocation[];
  wbEntries: WbEntrySummary[];
}

export interface MarkerFormResult {
  label: string;
  type: MarkerType;
  icon: string | null;
  color: string | null;
  description: string | null;
  locationId: string | null;
  wbEntryId: string | null;
}

const MARKER_TYPES: MarkerType[] = [
  'CITY',
  'TOWN',
  'VILLAGE',
  'DUNGEON',
  'LANDMARK',
  'RUINS',
  'TEMPLE',
  'FORTRESS',
  'PORT',
  'MOUNTAIN',
  'FOREST',
  'CUSTOM',
];

const COLOR_SWATCHES = [
  '#c9a84c',
  '#8b5cf6',
  '#3db05a',
  '#e05555',
  '#9088a0',
  '#584030',
  '#e09040',
  '#607090',
  '#3080c0',
  '#706050',
  '#206830',
  '#e0e0e0',
];

@Component({
  selector: 'app-marker-form-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MarkerTypeIconComponent],
  template: `
    <h2 mat-dialog-title>{{ data.marker ? 'Editar marcador' : 'Nuevo marcador' }}</h2>

    <mat-dialog-content>
      <div class="form-grid">
        <!-- Label -->
        <div class="field">
          <label>Nombre</label>
          <input type="text" [(ngModel)]="label" placeholder="Nombre del marcador" />
        </div>

        <!-- Type -->
        <div class="field">
          <label>Tipo</label>
          <div class="type-grid">
            @for (t of markerTypes; track t) {
              <button
                type="button"
                class="type-chip"
                [class.selected]="type() === t"
                (click)="type.set(t)"
              >
                <app-marker-type-icon [type]="t" />
                <span>{{ t }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Icon -->
        <div class="field">
          <label>Icono (emoji)</label>
          <input type="text" [(ngModel)]="icon" placeholder="Ej: 🏰" maxlength="4" />
        </div>

        <!-- Color -->
        <div class="field">
          <label>Color</label>
          <div class="swatches">
            @for (c of swatches; track c) {
              <button
                type="button"
                class="swatch"
                [style.background]="c"
                [class.selected]="color() === c"
                (click)="color.set(c)"
              ></button>
            }
          </div>
        </div>

        <!-- Description -->
        <div class="field">
          <label>Descripcion</label>
          <textarea
            [(ngModel)]="description"
            rows="3"
            placeholder="Descripcion opcional"
          ></textarea>
        </div>

        <!-- Location -->
        <div class="field">
          <label>Ubicacion del mundo</label>
          <select [(ngModel)]="locationId">
            <option [ngValue]="null">-- Ninguna --</option>
            @for (loc of data.locations; track loc.id) {
              <option [ngValue]="loc.id">{{ loc.name }} ({{ loc.type }})</option>
            }
          </select>
        </div>

        <!-- WB Entry -->
        <div class="field">
          <label>Entrada de World-Building</label>
          <select [(ngModel)]="wbEntryId">
            <option [ngValue]="null">-- Ninguna --</option>
            @for (entry of data.wbEntries; track entry.id) {
              <option [ngValue]="entry.id">{{ entry.name }}</option>
            }
          </select>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button type="button" class="btn-secondary" (click)="dialogRef.close(null)">Cancelar</button>
      <button type="button" class="btn-primary" [disabled]="!label.trim()" (click)="submit()">
        {{ data.marker ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    :host {
      display: block;
      width: 480px;
    }
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field label {
      font-size: 0.8rem;
      color: var(--text-secondary, #aaa);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    input,
    textarea,
    select {
      padding: 8px 10px;
      border: 1px solid var(--border-color, #333);
      border-radius: 6px;
      background: var(--surface-input, #1a1a2a);
      color: var(--text-primary, #eee);
      font-size: 0.9rem;
    }
    .type-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .type-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      border: 1px solid var(--border-color, #333);
      background: transparent;
      color: var(--text-secondary, #aaa);
      cursor: pointer;
    }
    .type-chip.selected {
      background: var(--accent, #8b5cf6);
      color: #fff;
      border-color: var(--accent, #8b5cf6);
    }
    .swatches {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .swatch {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
    }
    .swatch.selected {
      border-color: #fff;
      box-shadow: 0 0 0 2px var(--accent, #8b5cf6);
    }
    .btn-primary,
    .btn-secondary {
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: var(--accent, #8b5cf6);
      color: #fff;
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: transparent;
      color: var(--text-secondary, #aaa);
      border: 1px solid var(--border-color, #333);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkerFormDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<MarkerFormDialogComponent>);
  readonly data: MarkerFormData = inject(MAT_DIALOG_DATA);

  readonly markerTypes = MARKER_TYPES;
  readonly swatches = COLOR_SWATCHES;

  label = '';
  readonly type = signal<MarkerType>('CITY');
  icon = '';
  readonly color = signal<string | null>(null);
  description = '';
  locationId: string | null = null;
  wbEntryId: string | null = null;

  ngOnInit(): void {
    const m = this.data.marker;
    if (m) {
      this.label = m.label;
      this.type.set(m.type);
      this.icon = m.icon ?? '';
      this.color.set(m.color);
      this.description = m.description ?? '';
      this.locationId = m.location?.id ?? null;
      this.wbEntryId = m.wbEntry?.id ?? null;
    }
  }

  submit(): void {
    const result: MarkerFormResult = {
      label: this.label.trim(),
      type: this.type(),
      icon: this.icon.trim() || null,
      color: this.color(),
      description: this.description.trim() || null,
      locationId: this.locationId,
      wbEntryId: this.wbEntryId,
    };
    this.dialogRef.close(result);
  }
}
