import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { Genre } from '../../core/models/genre.model';
import { NovelSummary } from '../../core/models/novel.model';
import { GenresService } from '../../core/services/genres.service';
import { NovelsService } from '../../core/services/novels.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { NovelCardComponent } from './components/novel-card.component';
import {
  AdvancedNovelFiltersComponent,
  NovelFilters,
} from './components/advanced-novel-filters/advanced-novel-filters.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    FormsModule,
    ErrorMessageComponent,
    LoadingSpinnerComponent,
    NovelCardComponent,
    AdvancedNovelFiltersComponent,
  ],
  template: `
    <section class="catalog-shell">
      <aside class="filters">
        <h1>{{ title() }}</h1>
        <p>{{ subtitle() }}</p>

        <label>
          Buscar
          <input [(ngModel)]="search" placeholder="Buscar novelas..." />
        </label>

        <label>
          Genero
          <select [(ngModel)]="genre">
            <option value="">Todos</option>
            @for (item of genres(); track item.id) {
              <option [value]="item.slug">{{ item.label }}</option>
            }
          </select>
        </label>

        <label>
          Orden
          <select [(ngModel)]="sort">
            <option value="recent">Recientes</option>
            <option value="popular">Populares</option>
            <option value="views">Mas vistas</option>
          </select>
        </label>

        <button type="button" (click)="applyFilters()">Aplicar filtros</button>

        <app-advanced-novel-filters
          [initialFilters]="advancedFilters()"
          (filtersChange)="onAdvancedFiltersChange($event)"
        />
      </aside>

      <div class="results">
        @if (loading()) {
          <app-loading-spinner />
        } @else if (error()) {
          <app-error-message />
        } @else {
          <div class="grid">
            @for (novel of novels(); track novel.id) {
              <app-novel-card [novel]="novel" />
            }
          </div>

          @if (!novels().length) {
            <div class="empty">No se encontraron novelas con los filtros aplicados.</div>
          }

          @if (hasMore()) {
            <button class="load-more" type="button" (click)="loadMore()">Cargar mas</button>
          }
        }
      </div>
    </section>
  `,
  styles: [
    `
      .catalog-shell {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 1.5rem;
      }
      .filters,
      .results {
        padding: 1.25rem;
        border-radius: 1.25rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
      }
      .filters {
        display: grid;
        align-content: start;
        gap: 1rem;
      }
      label {
        display: grid;
        gap: 0.4rem;
        color: var(--text-2);
      }
      input,
      select,
      button {
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.75rem 0.9rem;
      }
      .grid {
        display: grid;
        gap: 1rem;
      }
      .empty,
      .load-more {
        margin-top: 1rem;
      }
      @media (max-width: 900px) {
        .catalog-shell {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CatalogPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly genresService = inject(GenresService);
  private readonly novelsService = inject(NovelsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly genres = signal<Genre[]>([]);
  readonly novels = signal<NovelSummary[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);
  readonly title = signal('Novelas');
  readonly subtitle = signal('Explora historias publicadas por la comunidad.');

  search = '';
  genre = '';
  sort: 'recent' | 'popular' | 'views' = 'recent';
  readonly advancedFilters = signal<NovelFilters>({});

  ngOnInit() {
    this.genresService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((genres) => {
      this.genres.set(genres);
      this.syncGenreCopy();
    });

    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      ([params, queryParams]) => {
        this.genre = params.get('genreSlug') ?? queryParams.get('genre') ?? '';
        this.search = queryParams.get('search') ?? '';
        const sort = queryParams.get('sort');
        this.sort = sort === 'popular' || sort === 'views' ? sort : 'recent';
        this.advancedFilters.set({
          language: queryParams.get('language'),
          updatedAfter: queryParams.get('updatedAfter'),
          updatedBefore: queryParams.get('updatedBefore'),
          tags: queryParams.getAll('tags'),
          ships: queryParams.getAll('ships'),
          status: queryParams.get('status'),
          sortBy: queryParams.get('sortBy'),
        });
        this.syncGenreCopy();
        this.load(true);
      },
    );
  }

  applyFilters() {
    const queryParams = {
      search: this.search || null,
      sort: this.sort !== 'recent' ? this.sort : null,
    };

    if (this.genre) {
      void this.router.navigate(['/novelas/genero', this.genre], {
        queryParams,
      });
      return;
    }

    void this.router.navigate(['/novelas'], {
      queryParams,
    });
  }

  loadMore() {
    this.load(false);
  }

  onAdvancedFiltersChange(filters: NovelFilters) {
    this.advancedFilters.set(filters);
    const queryParams: Record<string, string | string[] | null> = {
      search: this.search || null,
      sort: this.sort !== 'recent' ? this.sort : null,
      language: filters.language || null,
      updatedAfter: filters.updatedAfter || null,
      updatedBefore: filters.updatedBefore || null,
      tags: filters.tags?.length ? filters.tags : null,
      ships: filters.ships?.length ? filters.ships : null,
      status: filters.status || null,
      sortBy: filters.sortBy && filters.sortBy !== 'newest' ? filters.sortBy : null,
    };

    const target = this.genre ? ['/novelas/genero', this.genre] : ['/novelas'];
    void this.router.navigate(target, { queryParams });
  }

  private load(reset: boolean) {
    this.loading.set(reset);
    this.error.set(false);

    const adv = this.advancedFilters();
    this.novelsService
      .listPublic({
        cursor: reset ? null : this.nextCursor(),
        search: this.search || null,
        genre: this.genre || null,
        sort: this.sort,
        language: adv.language,
        updatedAfter: adv.updatedAfter,
        updatedBefore: adv.updatedBefore,
        tags: adv.tags,
        ships: adv.ships,
        status: (adv.status as 'COMPLETED' | null) || null,
        sortBy: adv.sortBy,
      })
      .subscribe({
        next: (response) => {
          this.novels.set(reset ? response.data : [...this.novels(), ...response.data]);
          this.nextCursor.set(response.pagination.nextCursor);
          this.hasMore.set(response.pagination.hasMore);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  private syncGenreCopy() {
    if (!this.genre) {
      this.title.set('Novelas');
      this.subtitle.set('Explora historias publicadas por la comunidad.');
      return;
    }

    const selectedGenre = this.genres().find((item) => item.slug === this.genre);
    const genreLabel = selectedGenre?.label ?? this.genre;
    this.title.set(`Genero: ${genreLabel}`);
    this.subtitle.set(`Todas las novelas publicas disponibles en ${genreLabel}.`);
  }
}
