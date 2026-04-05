import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WbCategorySummary } from '../../../../core/models/wb-category.model';
import { WbSearchBarComponent } from './wb-search-bar.component';

@Component({
  selector: 'app-wb-sidebar',
  standalone: true,
  imports: [RouterLink, WbSearchBarComponent],
  template: `
    <aside class="sidebar" data-testid="wb-sidebar">
      <a class="world-link" [routerLink]="['/mundos', worldSlug()]">
        {{ worldName() }}
      </a>

      <app-wb-search-bar
        placeholder="Buscar entradas..."
        (searchQuery)="searchQuery.emit($event)"
      />

      <nav class="cat-list">
        <button
          type="button"
          class="cat-item"
          [class.active]="!activeCategorySlug()"
          (click)="categorySelected.emit(null)"
        >
          <span class="cat-icon-slot">&#128218;</span>
          <span class="cat-name">Todas</span>
          <span class="cat-count">{{ totalCount() }}</span>
        </button>
        @for (cat of categories(); track cat.id) {
          <button
            type="button"
            class="cat-item"
            [class.active]="activeCategorySlug() === cat.slug"
            (click)="categorySelected.emit(cat.slug)"
          >
            <span class="cat-icon-slot">{{ cat.icon || '&#128196;' }}</span>
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-count">{{ cat.entriesCount }}</span>
          </button>
        }
      </nav>

      <button type="button" class="add-cat-btn" (click)="addCategory.emit()">
        + Nueva categoria
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      display: grid;
      gap: 0.75rem;
      align-content: start;
      padding: 1rem;
      border-radius: 1.25rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
      min-width: 200px;
    }
    .world-link {
      display: block;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-1);
      text-decoration: none;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .world-link:hover { color: var(--accent-text); }
    .cat-list {
      display: grid;
      gap: 0.15rem;
    }
    .cat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.55rem 0.65rem;
      border: none;
      border-radius: 0.75rem;
      background: transparent;
      color: var(--text-2);
      font-size: 0.82rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
    }
    .cat-item:hover { background: var(--bg-surface); }
    .cat-item.active {
      background: var(--accent-glow);
      color: var(--accent-text);
      font-weight: 600;
    }
    .cat-icon-slot { font-size: 1rem; flex-shrink: 0; }
    .cat-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cat-count {
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      background: var(--bg-surface);
      color: var(--text-3);
      min-width: 1.4rem;
      text-align: center;
    }
    .cat-item.active .cat-count {
      background: rgba(255,255,255,0.15);
      color: var(--accent-text);
    }
    .add-cat-btn {
      padding: 0.65rem 0.75rem;
      border-radius: 1rem;
      border: 1px dashed var(--border);
      background: transparent;
      color: var(--text-2);
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .add-cat-btn:hover {
      border-color: var(--accent-glow);
      color: var(--accent-text);
      background: var(--bg-surface);
    }
  `],
})
export class WbSidebarComponent {
  readonly worldSlug = input.required<string>();
  readonly worldName = input.required<string>();
  readonly categories = input.required<WbCategorySummary[]>();
  readonly activeCategorySlug = input<string | null>(null);

  readonly categorySelected = output<string | null>();
  readonly addCategory = output<void>();
  readonly searchQuery = output<string>();

  totalCount(): number {
    return this.categories().reduce((sum, c) => sum + c.entriesCount, 0);
  }
}
