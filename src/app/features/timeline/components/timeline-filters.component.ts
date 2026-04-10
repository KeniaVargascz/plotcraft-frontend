import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimelineEventType, TimelineEventRelevance } from '../../../core/models/timeline.model';

export interface TimelineFilters {
  type: TimelineEventType | null;
  relevance: TimelineEventRelevance | null;
  search: string;
}

const EVENT_TYPES: { value: TimelineEventType | null; label: string; icon: string }[] = [
  { value: null, label: 'Todos', icon: '' },
  { value: 'WORLD_EVENT', label: 'Mundo', icon: '\u{1F30D}' },
  { value: 'STORY_EVENT', label: 'Historia', icon: '\u{1F4D6}' },
  { value: 'CHARACTER_ARC', label: 'Personaje', icon: '\u{1F3AD}' },
  { value: 'CHAPTER_EVENT', label: 'Capitulo', icon: '\u{1F4C4}' },
  { value: 'LORE_EVENT', label: 'Lore', icon: '\u{1F4DC}' },
  { value: 'NOTE', label: 'Nota', icon: '\u{1F4DD}' },
];

const RELEVANCES: { value: TimelineEventRelevance | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'CRITICAL', label: 'Critico' },
  { value: 'MAJOR', label: 'Mayor' },
  { value: 'MINOR', label: 'Menor' },
  { value: 'BACKGROUND', label: 'Fondo' },
];

@Component({
  selector: 'app-timeline-filters',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="filter-bar">
      <div class="chip-group">
        <span class="group-label">Tipo:</span>
        @for (t of types; track t.label) {
          <button
            type="button"
            class="chip"
            [class.active]="selectedType() === t.value"
            (click)="selectType(t.value)"
          >
            {{ t.icon }} {{ t.label }}
          </button>
        }
      </div>

      <div class="chip-group">
        <span class="group-label">Relevancia:</span>
        @for (r of relevances; track r.label) {
          <button
            type="button"
            class="chip"
            [class.active]="selectedRelevance() === r.value"
            (click)="selectRelevance(r.value)"
          >
            {{ r.label }}
          </button>
        }
      </div>

      <div class="search-box">
        <input
          type="text"
          placeholder="Buscar eventos..."
          [ngModel]="searchText()"
          (ngModelChange)="onSearch($event)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .filter-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        padding: 0.5rem 0;
      }
      .chip-group {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-wrap: wrap;
      }
      .group-label {
        font-size: 0.72rem;
        color: var(--text-3);
        font-weight: 600;
      }
      .chip {
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        font-size: 0.72rem;
        cursor: pointer;
        transition: all 0.15s;
      }
      .chip:hover {
        border-color: var(--accent);
      }
      .chip.active {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: var(--accent);
      }
      .search-box {
        margin-left: auto;
      }
      .search-box input {
        padding: 0.4rem 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.8rem;
        width: 200px;
      }
      .search-box input::placeholder {
        color: var(--text-3);
      }
    `,
  ],
})
export class TimelineFiltersComponent {
  readonly filterChange = output<TimelineFilters>();

  readonly types = EVENT_TYPES;
  readonly relevances = RELEVANCES;

  readonly selectedType = signal<TimelineEventType | null>(null);
  readonly selectedRelevance = signal<TimelineEventRelevance | null>(null);
  readonly searchText = signal('');

  selectType(value: TimelineEventType | null) {
    this.selectedType.set(value);
    this.emit();
  }

  selectRelevance(value: TimelineEventRelevance | null) {
    this.selectedRelevance.set(value);
    this.emit();
  }

  onSearch(text: string) {
    this.searchText.set(text);
    this.emit();
  }

  private emit() {
    this.filterChange.emit({
      type: this.selectedType(),
      relevance: this.selectedRelevance(),
      search: this.searchText(),
    });
  }
}
