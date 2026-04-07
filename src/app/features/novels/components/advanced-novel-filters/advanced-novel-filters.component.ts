import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SUPPORTED_LANGUAGES } from '../../../../shared/constants/languages';
import { TagChipsInputComponent } from '../../../../shared/components/tag-chips-input/tag-chips-input.component';

export interface NovelFilters {
  language?: string | null;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
  tags?: string[];
  ships?: string[];
  status?: string | null;
  sortBy?: string | null;
}

@Component({
  selector: 'app-advanced-novel-filters',
  standalone: true,
  imports: [FormsModule, TagChipsInputComponent],
  template: `
    <div class="wrap">
      <button type="button" class="toggle" (click)="toggle()">
        <span>Filtros avanzados</span>
        @if (activeCount > 0) {
          <span class="badge">{{ activeCount }}</span>
        }
        <span class="chevron" [class.open]="expanded()">v</span>
      </button>

      @if (expanded()) {
        <div class="panel">
          <label>
            Idioma
            <select [(ngModel)]="filters.language">
              <option [ngValue]="null">Todos los idiomas</option>
              @for (l of languages; track l.code) {
                <option [ngValue]="l.code">{{ l.name }}</option>
              }
            </select>
          </label>

          <div class="row">
            <label>
              Desde
              <input type="date" [(ngModel)]="filters.updatedAfter" />
            </label>
            <label>
              Hasta
              <input type="date" [(ngModel)]="filters.updatedBefore" />
            </label>
          </div>

          <label>
            Etiquetas
            <app-tag-chips-input
              [tags]="tags"
              (tagsChange)="tags = $event"
              placeholder="Añadir etiqueta..."
            />
          </label>

          <label>
            Parejas/Ships
            <app-tag-chips-input
              [tags]="ships"
              (tagsChange)="ships = $event"
              placeholder="Añadir ship..."
            />
          </label>

          <label class="checkbox">
            <input type="checkbox" [(ngModel)]="onlyCompleted" />
            Solo completas
          </label>

          <label>
            Ordenar por
            <select [(ngModel)]="filters.sortBy">
              @for (s of sortOptions; track s.value) {
                <option [ngValue]="s.value">{{ s.label }}</option>
              }
            </select>
          </label>

          <div class="actions">
            <button type="button" class="primary" (click)="apply()">Aplicar filtros</button>
            <button type="button" (click)="clear()">Limpiar filtros</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .wrap {
        display: grid;
        gap: 0.5rem;
      }
      .toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
      }
      .badge {
        background: var(--accent-glow);
        color: var(--accent-text);
        padding: 0.1rem 0.55rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
      }
      .chevron {
        margin-left: auto;
        transition: transform 0.2s;
      }
      .chevron.open {
        transform: rotate(180deg);
      }
      .panel {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      label {
        display: grid;
        gap: 0.35rem;
        color: var(--text-2);
        font-size: 0.85rem;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      input,
      select,
      button {
        padding: 0.6rem 0.8rem;
        border-radius: 0.7rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
        cursor: pointer;
      }
      button {
        cursor: pointer;
      }
    `,
  ],
})
export class AdvancedNovelFiltersComponent {
  @Input() set initialFilters(value: NovelFilters) {
    this.filters = { ...value };
    this.tags = value.tags ?? [];
    this.ships = value.ships ?? [];
    this.onlyCompleted = value.status === 'COMPLETED';
  }
  @Output() filtersChange = new EventEmitter<NovelFilters>();

  readonly expanded = signal(false);
  readonly languages = SUPPORTED_LANGUAGES;

  filters: NovelFilters = {};
  tags: string[] = [];
  ships: string[] = [];
  onlyCompleted = false;

  sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'recently_updated', label: 'Actualizadas recientemente' },
    { value: 'most_voted', label: 'Más votadas' },
    { value: 'most_kudos', label: 'Más kudos' },
    { value: 'most_chapters', label: 'Más capítulos' },
    { value: 'most_words', label: 'Más palabras' },
  ];

  get activeCount(): number {
    let count = 0;
    if (this.filters.language) count++;
    if (this.filters.updatedAfter) count++;
    if (this.filters.updatedBefore) count++;
    if (this.tags.length) count++;
    if (this.ships.length) count++;
    if (this.onlyCompleted) count++;
    if (this.filters.sortBy && this.filters.sortBy !== 'newest') count++;
    return count;
  }

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  apply(): void {
    const out: NovelFilters = {
      ...this.filters,
      tags: this.tags.length ? this.tags : undefined,
      ships: this.ships.length ? this.ships : undefined,
      status: this.onlyCompleted ? 'COMPLETED' : this.filters.status || undefined,
    };
    this.filtersChange.emit(out);
  }

  clear(): void {
    this.filters = {};
    this.tags = [];
    this.ships = [];
    this.onlyCompleted = false;
    this.filtersChange.emit({});
  }
}
