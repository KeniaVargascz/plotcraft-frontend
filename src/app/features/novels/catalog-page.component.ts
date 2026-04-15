import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
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
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { GenreLabelPipe } from '../../shared/pipes/genre-label.pipe';
import { GenreLocalizationService } from '../../core/services/genre-localization.service';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    FormsModule,
    ErrorMessageComponent,
    LoadingSpinnerComponent,
    NovelCardComponent,
    AdvancedNovelFiltersComponent,
    PaginatorComponent,
    GenreLabelPipe,
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

        <div class="genre-field" #genreField>
          <span class="field-label">Géneros</span>

          @if (selectedGenres().length) {
            <ul class="picked-pills">
              @for (g of selectedGenres(); track g.id) {
                <li>
                    <span>{{ g | genreLabel }}</span>
                  <button type="button" (click)="removeGenre(g.slug)">✕</button>
                </li>
              }
            </ul>
          }

          @if (
            genres().length > 0 &&
            availableGenresFiltered().length === 0 &&
            !genreSearch.trim() &&
            selectedGenreSlugs().length === genres().length
          ) {
            <p class="hint">Has seleccionado todos los géneros disponibles.</p>
          } @else {
            <div class="char-search">
              <input
                type="text"
                [(ngModel)]="genreSearch"
                (focus)="genreDropdownOpen.set(true)"
                placeholder="Buscar género..."
              />
              @if (genreDropdownOpen() && availableGenresFiltered().length) {
                <ul class="dropdown">
                  @for (g of availableGenresFiltered(); track g.id) {
                    <li>
                      <button type="button" (click)="addGenre(g.slug)">
                          {{ g | genreLabel }}
                      </button>
                    </li>
                  }
                </ul>
              }
              @if (
                genreDropdownOpen() && availableGenresFiltered().length === 0 && genreSearch.trim()
              ) {
                <p class="hint">Sin resultados.</p>
              }
            </div>
          }
        </div>

        <label>
          Orden
          <select [(ngModel)]="sort">
            <option value="recent">Recientes</option>
            <option value="popular">Populares</option>
            <option value="views">Mas vistas</option>
          </select>
        </label>

        <app-advanced-novel-filters
          #advancedFiltersRef
          [initialFilters]="advancedFilters()"
          [pairingsAllowed]="hasFanfictionGenre()"
          (filtersChange)="onAdvancedFiltersChange($event)"
        />

        <div class="apply-row">
          <button type="button" (click)="clearAllFilters()">Limpiar filtros</button>
          <button type="button" class="primary-apply" (click)="applyAllFilters()">
            Aplicar filtros
          </button>
        </div>
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

          @if (totalPages() > 1) {
            <app-paginator
              [currentPage]="currentPage()"
              [totalPages]="totalPages()"
              (pageChange)="goToPage($event)"
            />
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
      .genre-field {
        display: grid;
        gap: 0.4rem;
        color: var(--text-2);
      }
      .field-label {
        font-size: 0.85rem;
      }
      .picked-pills {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .picked-pills li {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.78rem;
      }
      .picked-pills button {
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        padding: 0;
        font-size: 0.85rem;
      }
      .char-search {
        position: relative;
      }
      .char-search input {
        width: 100%;
        box-sizing: border-box;
      }
      .char-search .dropdown {
        position: absolute;
        left: 0;
        right: 0;
        margin: 0.25rem 0 0;
        padding: 0.25rem;
        list-style: none;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        max-height: 220px;
        overflow-y: auto;
        z-index: 10;
        box-shadow: 0 12px 28px -16px var(--shadow);
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--accent) 38%, var(--border)) transparent;
      }
      .char-search .dropdown::-webkit-scrollbar {
        width: 6px;
      }
      .char-search .dropdown::-webkit-scrollbar-track {
        background: transparent;
      }
      .char-search .dropdown::-webkit-scrollbar-thumb {
        background: color-mix(in srgb, var(--accent) 38%, var(--border));
        border-radius: 999px;
      }
      .char-search .dropdown::-webkit-scrollbar-thumb:hover {
        background: color-mix(in srgb, var(--accent) 55%, var(--border));
      }
      .char-search .dropdown li {
        padding: 0;
      }
      .char-search .dropdown button {
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        padding: 0.5rem 0.65rem;
        border-radius: 0.5rem;
        color: var(--text-1);
        cursor: pointer;
      }
      .char-search .dropdown button:hover {
        background: var(--bg-surface);
      }
      .hint {
        margin: 0;
        font-size: 0.78rem;
        color: var(--text-3);
      }
      .empty {
        margin-top: 1rem;
      }
      .apply-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .apply-row button {
        flex: 1;
      }
      .apply-row .primary-apply {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
        font-weight: 600;
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
  private readonly genreLocalization = inject(GenreLocalizationService);
  private readonly genresService = inject(GenresService);
  private readonly novelsService = inject(NovelsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly genres = signal<Genre[]>([]);
  readonly novels = signal<NovelSummary[]>([]);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly title = signal('Novelas');
  readonly subtitle = signal('Explora historias publicadas por la comunidad.');

  @ViewChild('advancedFiltersRef') advancedFiltersRef?: AdvancedNovelFiltersComponent;

  search = '';
  genre = '';
  sort: 'recent' | 'popular' | 'views' = 'recent';
  readonly advancedFilters = signal<NovelFilters>({});
  readonly selectedGenreSlugs = signal<string[]>([]);
  readonly genreDropdownOpen = signal(false);
  @ViewChild('genreField') genreFieldRef?: ElementRef<HTMLElement>;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.genreDropdownOpen()) return;
    const el = this.genreFieldRef?.nativeElement;
    if (el && !el.contains(event.target as Node)) {
      this.genreDropdownOpen.set(false);
    }
  }
  genreSearch = '';

  readonly selectedGenres = computed(() => {
    const slugs = this.selectedGenreSlugs();
    return this.genres().filter((g) => slugs.includes(g.slug));
  });

  readonly availableGenresFiltered = computed(() => {
    const slugs = this.selectedGenreSlugs();
    const term = this.genreSearch.trim().toLowerCase();
    return this.genres()
      .filter((g) => !slugs.includes(g.slug))
      .filter((g) => !term || this.genreLocalization.labelFor(g).toLowerCase().includes(term));
  });

  readonly hasFanfictionGenre = computed(() => this.selectedGenreSlugs().includes('fanfiction'));

  addGenre(slug: string) {
    if (this.selectedGenreSlugs().includes(slug)) return;
    this.selectedGenreSlugs.update((list) => [...list, slug]);
    this.genreSearch = '';
    this.genreDropdownOpen.set(false);
  }

  removeGenre(slug: string) {
    this.selectedGenreSlugs.update((list) => list.filter((s) => s !== slug));
  }

  ngOnInit() {
    this.genresService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((genres) => {
        this.genres.set(genres);
        this.syncGenreCopy();
      });

    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, queryParams]) => {
        this.genre = params.get('genreSlug') ?? queryParams.get('genre') ?? '';
        this.search = queryParams.get('search') ?? '';
        const sort = queryParams.get('sort');
        this.sort = sort === 'popular' || sort === 'views' ? sort : 'recent';
        this.advancedFilters.set({
          languageId: queryParams.get('languageId'),
          updatedAfter: queryParams.get('updatedAfter'),
          updatedBefore: queryParams.get('updatedBefore'),
          tags: queryParams.getAll('tags'),
          status: queryParams.get('status'),
          sortBy: queryParams.get('sortBy'),
          romanceGenres: queryParams.getAll('romanceGenres'),
          pairings: queryParams.getAll('pairings'),
          novelType: (queryParams.get('novelType') as 'ORIGINAL' | 'FANFIC' | null) || '',
          fandomSlug: queryParams.get('fandomSlug'),
        });
        this.selectedGenreSlugs.set(queryParams.getAll('genres'));
        this.syncGenreCopy();
        this.currentPage.set(1);
        this.load();
      });
  }

  applyAllFilters() {
    this.advancedFiltersRef?.apply();
    // apply() emits filtersChange which is handled by onAdvancedFiltersChange and triggers navigate
  }

  clearAllFilters() {
    this.search = '';
    this.sort = 'recent';
    this.selectedGenreSlugs.set([]);
    this.genreSearch = '';
    this.advancedFilters.set({});
    this.advancedFiltersRef?.clear();
    const target = this.genre ? ['/novelas/genero', this.genre] : ['/novelas'];
    void this.router.navigate(target);
  }

  applyFilters() {
    const adv = this.advancedFilters();
    const queryParams: Record<string, string | string[] | null> = {
      search: this.search || null,
      sort: this.sort !== 'recent' ? this.sort : null,
      genres: this.selectedGenreSlugs().length ? this.selectedGenreSlugs() : null,
      // Preserve advanced filter state in URL on basic filter apply
      languageId: adv.languageId || null,
      updatedAfter: adv.updatedAfter || null,
      updatedBefore: adv.updatedBefore || null,
      tags: adv.tags?.length ? adv.tags : null,
      status: adv.status || null,
      sortBy: adv.sortBy && adv.sortBy !== 'newest' ? adv.sortBy : null,
      romanceGenres: adv.romanceGenres?.length ? adv.romanceGenres : null,
      pairings: adv.pairings?.length ? adv.pairings : null,
    };

    if (this.genre) {
      void this.router.navigate(['/novelas/genero', this.genre], { queryParams });
      return;
    }

    void this.router.navigate(['/novelas'], { queryParams });
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.load();
  }

  onAdvancedFiltersChange(filters: NovelFilters) {
    this.advancedFilters.set(filters);
    const queryParams: Record<string, string | string[] | null> = {
      search: this.search || null,
      sort: this.sort !== 'recent' ? this.sort : null,
      languageId: filters.languageId || null,
      updatedAfter: filters.updatedAfter || null,
      updatedBefore: filters.updatedBefore || null,
      tags: filters.tags?.length ? filters.tags : null,
      status: filters.status || null,
      sortBy: filters.sortBy && filters.sortBy !== 'newest' ? filters.sortBy : null,
      romanceGenres: filters.romanceGenres?.length ? filters.romanceGenres : null,
      pairings: filters.pairings?.length ? filters.pairings : null,
      novelType: filters.novelType || null,
      fandomSlug: filters.fandomSlug || null,
      genres: this.selectedGenreSlugs().length ? this.selectedGenreSlugs() : null,
    };

    const target = this.genre ? ['/novelas/genero', this.genre] : ['/novelas'];
    void this.router.navigate(target, { queryParams });
  }

  private load() {
    this.loading.set(true);
    this.error.set(false);

    const adv = this.advancedFilters();
    this.novelsService
      .listPublic({
        page: this.currentPage(),
        limit: 12,
        search: this.search || null,
        genre: this.genre || null,
        sort: this.sort,
        languageId: adv.languageId,
        updatedAfter: adv.updatedAfter,
        updatedBefore: adv.updatedBefore,
        tags: adv.tags,
        status: (adv.status as 'COMPLETED' | null) || null,
        sortBy: adv.sortBy,
        romanceGenres:
          (adv.romanceGenres as ('BL' | 'GL' | 'HETEROSEXUAL' | 'OTHER')[] | null) || null,
        pairings: adv.pairings ?? null,
        novelType: (adv.novelType as 'ORIGINAL' | 'FANFIC') || null,
        fandomSlug: adv.fandomSlug || null,
        genres: this.selectedGenreSlugs().length ? this.selectedGenreSlugs() : null,
      })
      .subscribe({
        next: (response) => {
          this.novels.set(response.data);
          this.totalPages.set(response.pagination.totalPages);
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
    const genreLabel = selectedGenre
      ? this.genreLocalization.labelFor(selectedGenre)
      : this.genreLocalization.labelFor(this.genre);
    this.title.set(`Genero: ${genreLabel}`);
    this.subtitle.set(`Todas las novelas publicas disponibles en ${genreLabel}.`);
  }
}
