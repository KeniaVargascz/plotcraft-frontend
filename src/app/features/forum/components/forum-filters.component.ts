import { Component, OnInit, OnDestroy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ForumCategory } from '../../../core/models/forum-thread.model';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

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
      <div class="controls">
        <select
          [(ngModel)]="selectedCategoryModel"
          (ngModelChange)="selectCategory($event)"
          class="sort-select"
        >
          @for (cat of categories; track cat.value) {
            <option [value]="cat.value">{{ cat.label }}</option>
          }
        </select>

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
  styles: [
    `
      .filters-bar {
        display: grid;
        gap: 0.75rem;
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
      .search-input {
        flex: 1;
        min-width: 160px;
      }
      .sort-select {
        min-width: 140px;
      }
    `,
  ],
})
export class ForumFiltersComponent implements OnInit, OnDestroy {
  readonly filterChange = output<{
    category: ForumCategory | null;
    sort: string;
    search: string;
  }>();

  readonly categories = CATEGORIES;
  readonly selectedCategory = signal<ForumCategory | ''>('');
  selectedCategoryModel: ForumCategory | '' = '';
  selectedSort = 'recent';
  searchText = '';

  private readonly searchSubject = new Subject<string>();
  private searchSub: Subscription | null = null;

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
