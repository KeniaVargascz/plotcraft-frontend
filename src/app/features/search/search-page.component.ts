import {
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  MixedSearchResponse,
  SearchCharactersResponse,
  SearchNovelsResponse,
  SearchPostsResponse,
  SearchResponse,
  SearchResult,
  SearchTab,
  SearchUsersResponse,
  SearchWorldsResponse,
} from '../../core/models/search.model';
import { SearchResultCardComponent } from '../../shared/components/search-result-card/search-result-card.component';
import { Genre } from '../../core/models/genre.model';
import { GenresService } from '../../core/services/genres.service';
import { SearchService } from '../../core/services/search.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { HighlightPipe } from '../../shared/pipes/highlight.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CharacterCardComponent } from '../characters/components/character-card.component';
import { NovelCardComponent } from '../novels/components/novel-card.component';
import { WorldCardComponent } from '../worlds/components/world-card.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    SearchBarComponent,
    TranslatePipe,
    HighlightPipe,
    NovelCardComponent,
    WorldCardComponent,
    CharacterCardComponent,
    SearchResultCardComponent,
    PaginatorComponent,
  ],
  template: `
    <section class="search-page">
      <header class="hero">
        <div>
          <p class="eyebrow">Busqueda global</p>
          <h1>
            @if (query()) {
              {{ 'search.results' | translate: { count: resultCount(), query: query() } }}
            } @else {
              {{ 'search.placeholder' | translate }}
            }
          </h1>
          <p class="lede">{{ 'search.noResultsHint' | translate }}</p>
        </div>
        <app-search-bar />
      </header>

      <div class="tab-row">
        @for (item of tabs; track item.value) {
          <button
            type="button"
            [class.active]="activeTab() === item.value"
            (click)="setTab(item.value)"
          >
            {{ item.labelKey | translate }}
          </button>
        }
      </div>

      @if (activeTab() !== 'all') {
        <section class="filters">
          @if (activeTab() === 'novels') {
            <label>
              {{ 'search.filters.genre' | translate }}
              <select [(ngModel)]="genre" (ngModelChange)="applyFilters()">
                <option value="">Todos</option>
                @for (item of genres(); track item.id) {
                  <option [value]="item.slug">{{ item.label }}</option>
                }
              </select>
            </label>
            <label>
              {{ 'search.filters.sort' | translate }}
              <select [(ngModel)]="novelSort" (ngModelChange)="applyFilters()">
                <option value="relevance">{{ 'search.sort.relevance' | translate }}</option>
                <option value="recent">{{ 'search.sort.recent' | translate }}</option>
                <option value="popular">{{ 'search.sort.popular' | translate }}</option>
                <option value="views">{{ 'search.sort.views' | translate }}</option>
              </select>
            </label>
          }

          @if (activeTab() === 'worlds') {
            <label>
              {{ 'search.filters.sort' | translate }}
              <select [(ngModel)]="worldSort" (ngModelChange)="applyFilters()">
                <option value="relevance">{{ 'search.sort.relevance' | translate }}</option>
                <option value="recent">{{ 'search.sort.recent' | translate }}</option>
                <option value="popular">{{ 'search.sort.popular' | translate }}</option>
              </select>
            </label>
          }

          @if (activeTab() === 'users') {
            <label>
              {{ 'search.filters.sort' | translate }}
              <select [(ngModel)]="userSort" (ngModelChange)="applyFilters()">
                <option value="relevance">{{ 'search.sort.relevance' | translate }}</option>
                <option value="followers">{{ 'search.sort.followers' | translate }}</option>
                <option value="recent">{{ 'search.sort.recent' | translate }}</option>
              </select>
            </label>
          }

          @if (activeTab() === 'posts') {
            <label>
              {{ 'search.filters.sort' | translate }}
              <select [(ngModel)]="postSort" (ngModelChange)="applyFilters()">
                <option value="relevance">{{ 'search.sort.relevance' | translate }}</option>
                <option value="recent">{{ 'search.sort.recent' | translate }}</option>
                <option value="reactions">{{ 'search.sort.reactions' | translate }}</option>
              </select>
            </label>
          }
        </section>
      }

      @if (loading()) {
        <div class="empty-state">{{ 'search.loading' | translate }}</div>
      } @else if (!query()) {
        <div class="empty-state">{{ 'search.trySearching' | translate }}</div>
      } @else if (!hasAnyResults()) {
        <div class="empty-state">
          <h2>{{ 'search.noResults' | translate: { query: query() } }}</h2>
          <p>{{ 'search.noResultsHint' | translate }}</p>
        </div>
      } @else if (activeTab() === 'all') {
        <div class="results-shell" data-testid="search-results">
          @if (grouped() && grouped()!.results.novels.items.length) {
            <section class="result-section">
              <div class="section-head">
                <h2>{{ 'search.types.novels' | translate }}</h2>
                <a [routerLink]="['/buscar']" [queryParams]="{ q: query(), type: 'novels' }">
                  {{ 'search.viewAll' | translate: { type: ('search.types.novels' | translate) } }}
                </a>
              </div>
              <div class="grid">
                @for (novel of grouped()!.results.novels.items; track novel.id) {
                  <app-novel-card [novel]="novel" />
                }
              </div>
            </section>
          }

          @if (grouped() && grouped()!.results.worlds.items.length) {
            <section class="result-section">
              <div class="section-head">
                <h2>{{ 'search.types.worlds' | translate }}</h2>
              </div>
              <div class="compact-grid">
                @for (world of grouped()!.results.worlds.items; track world.id) {
                  <app-world-card [world]="world" />
                }
              </div>
            </section>
          }

          @if (grouped() && grouped()!.results.characters.items.length) {
            <section class="result-section">
              <div class="section-head">
                <h2>{{ 'search.types.characters' | translate }}</h2>
              </div>
              <div class="compact-grid">
                @for (character of grouped()!.results.characters.items; track character.id) {
                  <app-character-card [character]="character" />
                }
              </div>
            </section>
          }

          @if (grouped() && grouped()!.results.users.items.length) {
            <section class="result-section">
              <div class="section-head">
                <h2>{{ 'search.types.users' | translate }}</h2>
              </div>
              <div class="user-list">
                @for (user of grouped()!.results.users.items; track user.id) {
                  <a class="user-card" [routerLink]="['/perfil', user.username]">
                    <div class="avatar">{{ user.display_name.charAt(0) }}</div>
                    <div class="user-copy">
                      <strong>{{ user.display_name }}</strong>
                      <span>@{{ user.username }}</span>
                    </div>
                  </a>
                }
              </div>
            </section>
          }

          @if (grouped() && grouped()!.results.posts.items.length) {
            <section class="result-section">
              <div class="section-head">
                <h2>{{ 'search.types.posts' | translate }}</h2>
              </div>
              <div class="post-list">
                @for (post of grouped()!.results.posts.items; track post.id) {
                  <article class="post-result" [routerLink]="['/feed']">
                    <p [innerHTML]="post.content_excerpt | highlight: query()"></p>
                    <span
                      >{{ post.author.display_name }} ·
                      {{ post.stats.reactions_count }} reacciones</span
                    >
                  </article>
                }
              </div>
            </section>
          }

          @if (mixed().length) {
            <section class="result-section">
              <div class="section-head">
                <h2>{{ 'search.types.mixed' | translate }}</h2>
              </div>
              <div class="post-list">
                @for (r of mixed(); track r.id) {
                  <app-search-result-card [result]="r" [query]="query()" />
                }
              </div>
            </section>
          }
        </div>
      } @else {
        <div class="results-shell" data-testid="search-results">
          @if (activeTab() === 'novels') {
            <div class="grid">
              @for (novel of novels(); track novel.id) {
                <app-novel-card [novel]="novel" />
              }
            </div>
          }

          @if (activeTab() === 'worlds') {
            <div class="compact-grid">
              @for (world of worlds(); track world.id) {
                <app-world-card [world]="world" />
              }
            </div>
          }

          @if (activeTab() === 'characters') {
            <div class="compact-grid">
              @for (character of characters(); track character.id) {
                <app-character-card [character]="character" />
              }
            </div>
          }

          @if (activeTab() === 'users') {
            <div class="user-list">
              @for (user of users(); track user.id) {
                <a class="user-card" [routerLink]="['/perfil', user.username]">
                  <div class="avatar">{{ user.display_name.charAt(0) }}</div>
                  <div class="user-copy">
                    <strong>{{ user.display_name }}</strong>
                    <span>@{{ user.username }}</span>
                    <small
                      >{{ user.stats.followers_count }} seguidores ·
                      {{ user.stats.novels_count }} novelas</small
                    >
                  </div>
                </a>
              }
            </div>
          }

          @if (activeTab() === 'mixed') {
            <div class="post-list">
              @for (r of mixed(); track r.id) {
                <app-search-result-card [result]="r" [query]="query()" />
              }
            </div>
          }

          @if (activeTab() === 'posts') {
            <div class="post-list">
              @for (post of posts(); track post.id) {
                <article class="post-result" [routerLink]="['/feed']">
                  <p [innerHTML]="post.content_excerpt | highlight: query()"></p>
                  <span
                    >{{ post.author.display_name }} ·
                    {{ post.stats.comments_count }} comentarios</span
                  >
                </article>
              }
            </div>
          }

          @if (totalPages() > 1) {
            <app-paginator
              [currentPage]="currentPage()"
              [totalPages]="totalPages()"
              (pageChange)="goToPage($event)"
            />
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .search-page,
      .results-shell,
      .result-section {
        display: grid;
        gap: 1.2rem;
      }
      .hero,
      .filters,
      .empty-state,
      .user-card,
      .post-result {
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .hero,
      .filters,
      .empty-state {
        padding: 1.25rem;
        border-radius: 1.25rem;
      }
      .hero,
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }
      .hero {
        display: grid;
      }
      .eyebrow,
      .lede {
        color: var(--text-2);
      }
      .tab-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .tab-row button {
        border-radius: 999px;
        border: 1px solid var(--border);
        padding: 0.8rem 1rem;
        background: var(--bg-card);
        color: var(--text-2);
      }
      .tab-row button.active {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .filters label {
        display: grid;
        gap: 0.35rem;
        color: var(--text-2);
      }
      .filters select {
        min-width: 180px;
        border-radius: 0.9rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.75rem 0.9rem;
      }
      .section-head a,
      .user-card,
      .post-result {
        text-decoration: none;
        color: inherit;
      }
      .grid,
      .compact-grid,
      .user-list,
      .post-list {
        display: grid;
        gap: 1rem;
      }
      .compact-grid {
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }
      .user-card,
      .post-result {
        padding: 1rem;
        border-radius: 1rem;
      }
      .user-card {
        display: flex;
        align-items: center;
        gap: 0.9rem;
      }
      .avatar {
        width: 3rem;
        height: 3rem;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .user-copy {
        display: grid;
      }
      .user-copy span,
      .user-copy small,
      .post-result span {
        color: var(--text-2);
      }
      .post-result p {
        margin: 0 0 0.45rem;
      }
      .empty-state {
        text-align: center;
      }
    `,
  ],
})
export class SearchPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly genresService = inject(GenresService);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly activeTab = signal<SearchTab>('all');
  readonly loading = signal(true);
  readonly grouped = signal<SearchResponse | null>(null);
  readonly novels = signal<SearchNovelsResponse['data']>([]);
  readonly worlds = signal<SearchWorldsResponse['data']>([]);
  readonly characters = signal<SearchCharactersResponse['data']>([]);
  readonly users = signal<SearchUsersResponse['data']>([]);
  readonly posts = signal<SearchPostsResponse['data']>([]);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly genres = signal<Genre[]>([]);

  genre = '';
  novelSort: 'relevance' | 'recent' | 'popular' | 'views' = 'relevance';
  worldSort: 'relevance' | 'recent' | 'popular' = 'relevance';
  userSort: 'relevance' | 'followers' | 'recent' = 'relevance';
  postSort: 'relevance' | 'recent' | 'reactions' = 'relevance';

  readonly tabs = [
    { value: 'all' as const, labelKey: 'search.types.all' },
    { value: 'novels' as const, labelKey: 'search.types.novels' },
    { value: 'worlds' as const, labelKey: 'search.types.worlds' },
    { value: 'characters' as const, labelKey: 'search.types.characters' },
    { value: 'users' as const, labelKey: 'search.types.users' },
    { value: 'posts' as const, labelKey: 'search.types.posts' },
    { value: 'mixed' as const, labelKey: 'search.types.mixed' },
  ];

  readonly mixed = signal<SearchResult[]>([]);

  constructor() {
    this.genresService.list().subscribe((genres) => this.genres.set(genres));
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.query.set(params.get('q') ?? '');
      this.activeTab.set((params.get('type') as SearchTab | null) ?? 'all');
      this.genre = params.get('genre') ?? '';
      this.novelSort = (params.get('sort') as typeof this.novelSort | null) ?? 'relevance';
      this.worldSort = (params.get('sort') as typeof this.worldSort | null) ?? 'relevance';
      this.userSort = (params.get('sort') as typeof this.userSort | null) ?? 'relevance';
      this.postSort = (params.get('sort') as typeof this.postSort | null) ?? 'relevance';
      this.load(true);
    });
  }

  resultCount() {
    if (this.activeTab() === 'all' && this.grouped()) {
      const results = this.grouped()!.results;
      return (
        results.novels.total_hint +
        results.worlds.total_hint +
        results.characters.total_hint +
        results.users.total_hint +
        results.posts.total_hint +
        this.mixed().length
      );
    }

    return (
      this.novels().length +
      this.worlds().length +
      this.characters().length +
      this.users().length +
      this.posts().length +
      this.mixed().length
    );
  }

  hasAnyResults() {
    return this.resultCount() > 0;
  }

  setTab(tab: SearchTab) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.query(),
        type: tab === 'all' ? null : tab,
      },
      queryParamsHandling: 'merge',
    });
  }

  applyFilters() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.query(),
        type: this.activeTab() === 'all' ? null : this.activeTab(),
        genre: this.activeTab() === 'novels' ? this.genre || null : null,
        sort: this.resolveSort(),
      },
      queryParamsHandling: 'merge',
    });
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.load(false);
  }

  private load(reset: boolean) {
    if (!this.query().trim()) {
      this.loading.set(false);
      this.grouped.set(null);
      this.novels.set([]);
      this.worlds.set([]);
      this.characters.set([]);
      this.users.set([]);
      this.posts.set([]);
      this.mixed.set([]);
      return;
    }

    this.loading.set(reset);

    if (this.activeTab() === 'all') {
      this.searchService.searchAll({ q: this.query().trim(), limit: 5 }).subscribe({
        next: (response) => {
          this.grouped.set(response);
          this.loading.set(false);
        },
        error: () => {
          this.grouped.set(null);
          this.loading.set(false);
        },
      });
      this.searchService
        .searchMixed({ q: this.query().trim(), types: ['posts', 'threads', 'communities'] })
        .subscribe({
          next: (response) => this.mixed.set(response.results ?? []),
          error: () => this.mixed.set([]),
        });
      return;
    }

    if (reset) this.currentPage.set(1);

    if (this.activeTab() === 'novels') {
      this.searchService
        .searchNovels({
          q: this.query().trim(),
          page: this.currentPage(),
          genre: this.genre || null,
          sort: this.novelSort,
        })
        .subscribe({
          next: (response) => this.consumeNovels(response),
          error: () => this.finishSpecificLoad(1),
        });
      return;
    }

    if (this.activeTab() === 'worlds') {
      this.searchService
        .searchWorlds({
          q: this.query().trim(),
          page: this.currentPage(),
          sort: this.worldSort,
        })
        .subscribe({
          next: (response) => this.consumeWorlds(response),
          error: () => this.finishSpecificLoad(1),
        });
      return;
    }

    if (this.activeTab() === 'characters') {
      this.searchService
        .searchCharacters({
          q: this.query().trim(),
          page: this.currentPage(),
        })
        .subscribe({
          next: (response) => this.consumeCharacters(response),
          error: () => this.finishSpecificLoad(1),
        });
      return;
    }

    if (this.activeTab() === 'users') {
      this.searchService
        .searchUsers({
          q: this.query().trim(),
          page: this.currentPage(),
          sort: this.userSort,
        })
        .subscribe({
          next: (response) => this.consumeUsers(response),
          error: () => this.finishSpecificLoad(1),
        });
      return;
    }

    if (this.activeTab() === 'mixed') {
      this.searchService
        .searchMixed({
          q: this.query().trim(),
          page: this.currentPage(),
          types: ['posts', 'threads', 'communities'],
        })
        .subscribe({
          next: (response) => this.consumeMixed(response),
          error: () => this.finishSpecificLoad(1),
        });
      return;
    }

    this.searchService
      .searchPosts({
        q: this.query().trim(),
        page: this.currentPage(),
        sort: this.postSort,
      })
      .subscribe({
        next: (response) => this.consumePosts(response),
        error: () => this.finishSpecificLoad(1),
      });
  }

  private consumeMixed(response: MixedSearchResponse) {
    this.grouped.set(null);
    this.mixed.set(response.results);
    this.finishSpecificLoad(1);
  }

  private consumeNovels(response: SearchNovelsResponse) {
    this.grouped.set(null);
    this.novels.set(response.data);
    this.finishSpecificLoad(response.pagination.totalPages);
  }

  private consumeWorlds(response: SearchWorldsResponse) {
    this.grouped.set(null);
    this.worlds.set(response.data);
    this.finishSpecificLoad(response.pagination.totalPages);
  }

  private consumeCharacters(response: SearchCharactersResponse) {
    this.grouped.set(null);
    this.characters.set(response.data);
    this.finishSpecificLoad(response.pagination.totalPages);
  }

  private consumeUsers(response: SearchUsersResponse) {
    this.grouped.set(null);
    this.users.set(response.data);
    this.finishSpecificLoad(response.pagination.totalPages);
  }

  private consumePosts(response: SearchPostsResponse) {
    this.grouped.set(null);
    this.posts.set(response.data);
    this.finishSpecificLoad(response.pagination.totalPages);
  }

  private finishSpecificLoad(totalPages: number) {
    this.totalPages.set(totalPages);
    this.loading.set(false);
  }

  private resolveSort() {
    switch (this.activeTab()) {
      case 'novels':
        return this.novelSort;
      case 'worlds':
        return this.worldSort;
      case 'users':
        return this.userSort;
      case 'posts':
        return this.postSort;
      default:
        return null;
    }
  }

}
