import { Component, OnInit, OnDestroy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ForumCategory } from '../../../core/models/forum-thread.model';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

type CategoryOption = { value: ForumCategory | ''; label: string };

const CATEGORIES: CategoryOption[] = [
  { value: '', label: 'Todas' },
  { value: 'GENERAL', label: 'General' },
  { value: 'FEEDBACK', label: 'Feedback' },
  { value: 'WRITING_TIPS', label: 'Consejos' },
  { value: 'WORLD_BUILDING', label: 'Worldbuilding' },
  { value: 'CHARACTERS', label: 'Personajes' },
  { value: 'SHOWCASE', label: 'Showcase' },
  { value: 'ANNOUNCEMENTS', label: 'Anuncios' },
  { value: 'HELP', label: 'Ayuda' },
  { value: 'OFF_TOPIC', label: 'Off-topic' },
];

@Component({
  selector: 'app-forum-filters',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="filters-bar">
      <div class="categories">
        @for (cat of categories; track cat.value) {
          <button
            type="button"
            class="chip"
            [class.active]="selectedCategory() === cat.value"
            (click)="selectCategory(cat.value)"
          >
            {{ cat.label }}
          </button>
        }
      </div>

      <div class="controls">
        <select [(ngModel)]="selectedSort" (ngModelChange)="emitChange()" class="sort-select">
          <option value="recent">Recientes</option>
          <option value="popular">Populares</option>
          <option value="replies">Mas respuestas</option>
          <option value="unanswered">Sin respuesta</option>
        </select>

        <input
          type="text"
          class="search-input"
          placeholder="Buscar..."
          [(ngModel)]="searchText"
          (ngModelChange)="onSearchInput($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .filters-bar {
      display: grid;
      gap: 0.75rem;
    }
    .categories {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .chip {
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-2);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip:hover { border-color: var(--accent); }
    .chip.active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }
    .controls {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
    }
    .sort-select,
    .search-input {
      padding: 0.55rem 0.75rem;
      border-radius: 0.65rem;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-1);
      font-size: 0.85rem;
    }
    .search-input { flex: 1; min-width: 160px; }
    .sort-select { min-width: 140px; }
  `],
})
export class ForumFiltersComponent implements OnInit, OnDestroy {
  readonly filterChange = output<{ category: ForumCategory | null; sort: string; search: string }>();

  readonly categories = CATEGORIES;
  readonly selectedCategory = signal<ForumCategory | ''>('');
  selectedSort = 'recent';
  searchText = '';

  private readonly searchSubject = new Subject<string>();
  private searchSub: any;

  ngOnInit() {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.emitChange());
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  selectCategory(value: ForumCategory | '') {
    this.selectedCategory.set(value);
    this.emitChange();
  }

  onSearchInput(value: string) {
    this.searchSubject.next(value);
  }

  emitChange() {
    this.filterChange.emit({
      category: this.selectedCategory() || null,
      sort: this.selectedSort,
      search: this.searchText.trim(),
    });
  }
}
