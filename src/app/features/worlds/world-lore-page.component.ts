import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WbCategorySummary } from '../../core/models/wb-category.model';
import { WbEntrySummary } from '../../core/models/wb-entry.model';
import { WorldSummary } from '../../core/models/world.model';
import { WorldsService } from '../../core/services/worlds.service';
import { WorldbuildingService } from '../../core/services/worldbuilding.service';
import { WbEntryCardComponent } from './worldbuilding/components/wb-entry-card.component';
import { WbSearchBarComponent } from './worldbuilding/components/wb-search-bar.component';

@Component({
  selector: 'app-world-lore-page',
  standalone: true,
  imports: [RouterLink, WbEntryCardComponent, WbSearchBarComponent],
  template: `
    <section class="lore-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">
            <a [routerLink]="['/mundos', worldSlug()]">{{ worldName() }}</a>
          </p>
          <h1>Lore del mundo</h1>
          <p class="lede">Explora las entradas de world-building de este universo.</p>
        </div>
        <app-wb-search-bar
          placeholder="Buscar en el lore..."
          (searchQuery)="onSearch($event)"
        />
      </header>

      <!-- Category filter chips -->
      @if (categories().length) {
        <div class="filter-chips">
          <button
            type="button"
            class="chip"
            [class.active]="!activeCategory()"
            (click)="filterByCategory(null)"
          >Todas</button>
          @for (cat of categories(); track cat.id) {
            <button
              type="button"
              class="chip"
              [class.active]="activeCategory() === cat.slug"
              (click)="filterByCategory(cat.slug)"
            >
              {{ cat.icon || '' }} {{ cat.name }}
              <span class="chip-count">{{ cat.entriesCount }}</span>
            </button>
          }
        </div>
      }

      @if (loading()) {
        <p class="state">Cargando entradas...</p>
      } @else if (entries().length) {
        <div class="entries-grid">
          @for (entry of entries(); track entry.id) {
            <a [routerLink]="['/mundos', worldSlug(), 'lore', entry.slug]" class="entry-link">
              <app-wb-entry-card [entry]="entry" />
            </a>
          }
        </div>
        @if (hasMore()) {
          <button type="button" class="load-more" (click)="loadMore()" [disabled]="loadingMore()">
            {{ loadingMore() ? 'Cargando...' : 'Cargar mas' }}
          </button>
        }
      } @else {
        <div class="card empty">
          <p>No hay entradas de lore publicas en este mundo.</p>
        </div>
      }
    </section>
  `,
  styles: [`
    .lore-shell { display: grid; gap: 1rem; }
    .card {
      padding: 1.25rem;
      border-radius: 1.25rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
    }
    .hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .eyebrow { color: var(--text-3); font-size: 0.82rem; margin: 0; }
    .eyebrow a { color: var(--accent-text); text-decoration: none; }
    h1 { margin: 0.25rem 0; }
    .lede { color: var(--text-2); margin: 0; }
    .filter-chips {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.45rem 0.85rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-2);
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip:hover { border-color: var(--accent-glow); }
    .chip.active {
      background: var(--accent-glow);
      color: var(--accent-text);
      border-color: transparent;
    }
    .chip-count {
      font-size: 0.68rem;
      padding: 0.05rem 0.35rem;
      border-radius: 999px;
      background: rgba(0,0,0,0.15);
      min-width: 1.2rem;
      text-align: center;
    }
    .entries-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    }
    .entry-link { text-decoration: none; display: block; height: 100%; }
    .state { color: var(--text-3); text-align: center; padding: 2rem; }
    .empty { text-align: center; }
    .empty p { color: var(--text-2); }
    .load-more {
      display: block;
      margin: 0 auto;
      padding: 0.7rem 1.5rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-1);
      cursor: pointer;
    }
    .load-more:hover { background: var(--bg-card); }
  `],
})
export class WorldLorePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly worldsService = inject(WorldsService);
  private readonly wbService = inject(WorldbuildingService);

  readonly worldSlug = signal('');
  readonly worldName = signal('');
  readonly categories = signal<WbCategorySummary[]>([]);
  readonly entries = signal<WbEntrySummary[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly activeCategory = signal<string | null>(null);
  private nextCursor: string | null = null;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.worldSlug.set(slug);
      this.worldsService.getBySlug(slug).subscribe({
        next: (w) => this.worldName.set(w.name),
        error: () => this.worldName.set('Mundo'),
      });
      this.wbService.listCategories(slug).subscribe({
        next: (cats) => this.categories.set(cats),
        error: () => this.categories.set([]),
      });
      this.loadEntries();
    });
  }

  filterByCategory(catSlug: string | null) {
    this.activeCategory.set(catSlug);
    this.loadEntries();
  }

  onSearch(query: string) {
    if (!query) {
      this.loadEntries();
      return;
    }
    this.loading.set(true);
    this.wbService.searchEntries(this.worldSlug(), query).subscribe({
      next: (res) => {
        this.entries.set(res.data);
        this.hasMore.set(res.pagination.hasMore);
        this.nextCursor = res.pagination.nextCursor;
        this.loading.set(false);
      },
      error: () => {
        this.entries.set([]);
        this.loading.set(false);
      },
    });
  }

  loadMore() {
    if (!this.nextCursor || this.loadingMore()) return;
    this.loadingMore.set(true);
    const catSlug = this.activeCategory();
    const req = catSlug
      ? this.wbService.listCategoryEntries(this.worldSlug(), catSlug, { cursor: this.nextCursor, limit: 20, isPublic: true })
      : this.wbService.listEntries(this.worldSlug(), { cursor: this.nextCursor, limit: 20, isPublic: true });

    req.pipe(finalize(() => this.loadingMore.set(false))).subscribe({
      next: (res) => {
        this.entries.update((current) => [...current, ...res.data]);
        this.hasMore.set(res.pagination.hasMore);
        this.nextCursor = res.pagination.nextCursor;
      },
    });
  }

  private loadEntries() {
    this.loading.set(true);
    this.nextCursor = null;
    const catSlug = this.activeCategory();
    const req = catSlug
      ? this.wbService.listCategoryEntries(this.worldSlug(), catSlug, { limit: 20, isPublic: true })
      : this.wbService.listEntries(this.worldSlug(), { limit: 20, isPublic: true });

    req.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => {
        this.entries.set(res.data);
        this.hasMore.set(res.pagination.hasMore);
        this.nextCursor = res.pagination.nextCursor;
      },
      error: () => this.entries.set([]),
    });
  }
}
