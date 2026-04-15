import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ForumCategory, ThreadStatus, ThreadSummary } from '../../core/models/forum-thread.model';
import { AuthService } from '../../core/services/auth.service';
import { ForumService } from '../../core/services/forum.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { ThreadCardComponent } from './components/thread-card.component';
import { ForumFiltersComponent } from './components/forum-filters.component';

@Component({
  selector: 'app-forum-home-page',
  standalone: true,
  imports: [
    RouterLink,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    ThreadCardComponent,
    ForumFiltersComponent,
  ],
  template: `
    <section class="forum-shell">
      <main class="main-col">
        <div class="top-bar">
          <h1 class="page-title">Foro</h1>
          @if (isAuthenticated()) {
            <a routerLink="/foro/nuevo" class="new-btn">+ Nuevo hilo</a>
          }
        </div>

        @if (isAuthenticated()) {
          <div class="scope-tabs">
            <button type="button" [class.active]="relevantOnly()" (click)="setScope(true)">
              Para ti
            </button>
            <button type="button" [class.active]="!relevantOnly()" (click)="setScope(false)">
              Todos los hilos
            </button>
          </div>
        }

        <app-forum-filters (filterChange)="onFilterChange($event)" />

        @if (loading()) {
          <app-loading-spinner />
        } @else if (error()) {
          <app-error-message />
        } @else {
          <div class="thread-list">
            @for (thread of pinnedThreads(); track thread.id) {
              <app-thread-card [thread]="thread" />
            }
            @for (thread of regularThreads(); track thread.id) {
              <app-thread-card
                [thread]="thread"
                [showArchiveBtn]="isMyThread(thread)"
                (archive)="onArchiveThread($event)"
              />
            }
          </div>

          @if (!threads().length) {
            <div class="empty">No se encontraron hilos.</div>
          }

          @if (hasMore()) {
            <button type="button" class="load-more" (click)="loadMore()">Cargar mas</button>
          }
        }

        @if (isAuthenticated() && archivedCount() > 0) {
          <a routerLink="/foro/archivados" class="archived-link">
            📦 Ver mis hilos archivados ({{ archivedCount() }})
          </a>
        }
      </main>

      <aside class="sidebar">
        @if (isAuthenticated() && userStats()) {
          <div class="sidebar-card">
            <h3>Estadisticas</h3>
            <ul class="stats-list">
              <li>
                <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                <strong>{{ userStats()!.threadsCount }}</strong> Hilos
              </li>
              <li>
                <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <strong>{{ userStats()!.repliesCount }}</strong> Respuestas
              </li>
              <li>
                <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                <strong>{{ userStats()!.solutionsCount }}</strong> Soluciones
              </li>
            </ul>
          </div>
        }

        @if (trendingTags().length) {
          <div class="sidebar-card">
            <h3>Tendencias</h3>
            <ol class="trending-list">
              @for (t of trendingTags(); track t.tag; let i = $index) {
                <li>
                  <button
                    type="button"
                    class="tag-btn"
                    [class.active]="activeTag() === t.tag"
                    (click)="filterByTag(t.tag)"
                  >
                    <span class="rank">{{ i + 1 }}</span>
                    <span class="tag-name">#{{ t.tag }}</span>
                  </button>
                </li>
              }
            </ol>
          </div>
        }
      </aside>
    </section>
  `,
  styles: [
    `
      .forum-shell {
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 1.5rem;
        max-width: 1100px;
        margin: 0 auto;
        padding: 1.5rem;
      }
      .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .page-title {
        font-size: 1.5rem;
        color: var(--text-1);
        margin: 0;
      }
      .new-btn {
        display: inline-flex;
        align-items: center;
        padding: 0.55rem 1.1rem;
        border-radius: 0.75rem;
        background: var(--accent);
        color: #fff;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .new-btn:hover {
        box-shadow: 0 0 12px var(--accent-glow);
      }
      .thread-list {
        display: grid;
        gap: 0.75rem;
        margin-top: 1rem;
      }
      .empty {
        text-align: center;
        padding: 2rem;
        color: var(--text-3);
      }
      .load-more {
        display: block;
        margin: 1rem auto 0;
        padding: 0.55rem 1.5rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font-weight: 500;
      }
      .load-more:hover {
        border-color: var(--accent);
      }
      .sidebar {
        display: grid;
        align-content: start;
        gap: 1rem;
      }
      .sidebar-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1rem 1.15rem;
      }
      .sidebar-card h3 {
        margin: 0 0 0.5rem;
        font-size: 0.95rem;
        color: var(--text-1);
      }
      .stats-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.35rem;
      }
      .stats-list li {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--text-2);
        font-size: 0.9rem;
      }
      .stat-icon {
        width: 16px;
        height: 16px;
        color: var(--accent);
        flex-shrink: 0;
      }
      .stats-list strong {
        color: var(--text-1);
        margin-right: 0.25rem;
      }
      .trending-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.15rem;
      }
      .tag-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        width: 100%;
        padding: 0.35rem 0.5rem;
        border: none;
        border-radius: 0.5rem;
        background: none;
        color: var(--text-2);
        font-size: 0.82rem;
        cursor: pointer;
        transition: all 0.15s;
      }
      .tag-btn:hover {
        background: var(--bg-surface);
        color: var(--accent);
      }
      .tag-btn.active {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .rank {
        color: var(--text-3);
        font-size: 0.75rem;
        min-width: 1rem;
        text-align: right;
      }
      .tag-name {
        flex: 1;
        text-align: left;
      }
      .archived-link {
        display: block;
        margin-top: 1rem;
        padding: 0.7rem 1rem;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        text-align: center;
        text-decoration: none;
        font-size: 0.85rem;
        color: var(--text-3);
        transition: all 0.15s;
      }
      .archived-link:hover {
        color: var(--text-1);
        border-color: var(--border-s);
        background: var(--bg-surface);
      }
      .scope-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .scope-tabs button {
        padding: 0.55rem 1.1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-2);
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .scope-tabs button.active {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      @media (max-width: 900px) {
        .forum-shell {
          grid-template-columns: 1fr;
        }
        .sidebar {
          order: -1;
        }
      }
    `,
  ],
})
export class ForumHomePageComponent implements OnInit {
  private readonly forumService = inject(ForumService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly threads = signal<ThreadSummary[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);
  readonly totalThreads = signal(0);
  readonly myThreads = signal<ThreadSummary[]>([]);
  readonly userStats = signal<{ threadsCount: number; repliesCount: number; solutionsCount: number } | null>(null);
  readonly relevantOnly = signal(true);
  readonly trendingTags = signal<{ tag: string; count: number }[]>([]);
  readonly activeTag = signal<string | null>(null);
  readonly archivedCount = computed(
    () => this.myThreads().filter((t) => t.status === 'ARCHIVED').length,
  );

  private currentFilters: { category: ForumCategory | null; sort: string; search: string } = {
    category: null,
    sort: 'recent',
    search: '',
  };

  private currentTag: string | null = null;

  isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  isMyThread(thread: ThreadSummary) {
    const user = this.authService.getCurrentUserSnapshot();
    return !!user && thread.author.username === user.username;
  }

  pinnedThreads() {
    return this.threads().filter((t) => t.isPinned);
  }

  regularThreads() {
    return this.threads().filter((t) => !t.isPinned);
  }

  ngOnInit() {
    this.load(true);
    this.forumService.getTrendingTags().subscribe({
      next: (tags) => this.trendingTags.set(tags),
    });
    if (this.authService.isAuthenticated()) {
      this.forumService.listMyThreads({ limit: 50 }).subscribe({
        next: (res) => this.myThreads.set(res.data),
      });
      this.forumService.getMyStats().subscribe({
        next: (stats) => this.userStats.set(stats),
      });
    }
  }

  setScope(relevant: boolean) {
    if (this.relevantOnly() === relevant) return;
    this.relevantOnly.set(relevant);
    this.load(true);
  }

  onFilterChange(filters: { category: ForumCategory | null; sort: string; search: string }) {
    this.currentFilters = filters;
    this.load(true);
  }

  filterByTag(tag: string) {
    if (this.activeTag() === tag) {
      this.activeTag.set(null);
      this.currentTag = null;
    } else {
      this.activeTag.set(tag);
      this.currentTag = tag;
    }
    this.load(true);
  }

  loadMore() {
    this.load(false);
  }

  onArchiveThread(thread: ThreadSummary) {
    this.forumService.archiveThread(thread.slug).subscribe({
      next: () => {
        this.threads.update((list) => list.filter((t) => t.id !== thread.id));
        this.myThreads.update((list) =>
          list.map((item) =>
            item.id === thread.id ? { ...item, status: 'ARCHIVED' as ThreadStatus } : item,
          ),
        );
      },
    });
  }

  private load(reset: boolean) {
    if (reset) {
      this.loading.set(true);
      this.error.set(false);
    }

    this.forumService
      .listThreads({
        cursor: reset ? null : this.nextCursor(),
        category: this.currentFilters.category,
        search: this.currentFilters.search || null,
        tag: this.currentTag,
        relevant: this.relevantOnly() && this.authService.isAuthenticated(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const list = reset ? res.data : [...this.threads(), ...res.data];
          this.threads.set(list);
          this.nextCursor.set(res.pagination.nextCursor);
          this.hasMore.set(res.pagination.hasMore);
          if (reset) this.totalThreads.set(list.length);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
