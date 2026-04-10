import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CommunityForumsService } from './services/community-forums.service';
import { CommunityForum, ForumThread, ThreadSortBy } from './models/community-forum.model';

@Component({
  selector: 'app-forum-page',
  standalone: true,
  imports: [RouterLink, FormsModule, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (notFound()) {
      <p class="empty">Foro no encontrado.</p>
    } @else if (forum(); as f) {
      <section class="page">
        <nav class="breadcrumb">
          <a routerLink="/comunidades">Comunidades</a>
          <span>/</span>
          <a [routerLink]="['/comunidades', communitySlug()]">{{
            f.communityName ?? communitySlug()
          }}</a>
          <span>/</span>
          <span>{{ f.name }}</span>
        </nav>

        <header class="header">
          <h1>{{ f.name }}</h1>
          @if (f.description) {
            <p class="desc">{{ f.description }}</p>
          }
          <p class="stats">{{ f.membersCount }} miembros · {{ f.threadsCount }} hilos</p>
          <div class="actions">
            @if (isAuth()) {
              @if (!f.isMember && f.isPublic) {
                <button type="button" class="btn primary" (click)="join()">Unirse al foro</button>
              }
              @if (f.isMember) {
                <a
                  class="btn primary"
                  [routerLink]="['/comunidades', communitySlug(), 'foros', f.slug, 'nuevo-hilo']"
                >
                  Nuevo hilo
                </a>
              }
            }
          </div>
        </header>

        @if (f.rules) {
          <details class="rules">
            <summary>Reglas del foro</summary>
            <div class="md" [innerHTML]="rulesHtml()"></div>
          </details>
        }

        <div class="sort-row">
          <label>
            Ordenar por:
            <select [(ngModel)]="sortBy" (ngModelChange)="onSortChange()">
              <option value="newest">Recientes</option>
              <option value="most_replies">Más respondidos</option>
              <option value="most_reactions">Más reacciones</option>
            </select>
          </label>
        </div>

        @if (threads().length === 0 && !threadsLoading()) {
          <p class="empty">Todavía no hay hilos en este foro. ¡Sé el primero!</p>
        } @else {
          <div class="thread-list">
            @for (t of threads(); track t.id) {
              <article class="thread-card">
                <div class="head">
                  @if (t.isPinned || t.status === 'PINNED') {
                    <span class="badge pin">📌 Fijado</span>
                  }
                  @if (t.status === 'CLOSED') {
                    <span class="badge closed">🔒 Cerrado</span>
                  }
                </div>
                <h3>
                  <a
                    [routerLink]="[
                      '/comunidades',
                      communitySlug(),
                      'foros',
                      f.slug,
                      'hilos',
                      t.slug,
                    ]"
                  >
                    {{ t.title }}
                  </a>
                </h3>
                <div class="meta">
                  <span>&#64;{{ t.author.username }}</span>
                  <span>· {{ relativeTime(t.createdAt) }}</span>
                </div>
                @if (t.tags?.length) {
                  <div class="tags">
                    @for (tag of (t.tags ?? []).slice(0, 3); track tag) {
                      <span class="tag">#{{ tag }}</span>
                    }
                    @if ((t.tags ?? []).length > 3) {
                      <span class="tag">+{{ (t.tags ?? []).length - 3 }}</span>
                    }
                  </div>
                }
                <p class="stats">
                  {{ t.repliesCount }} respuestas · {{ t.reactionsCount }} reacciones
                </p>
              </article>
            }
          </div>
          @if (hasMore()) {
            <button
              type="button"
              class="btn load-more"
              (click)="loadMore()"
              [disabled]="threadsLoading()"
            >
              {{ threadsLoading() ? 'Cargando...' : 'Cargar más' }}
            </button>
          }
        }
      </section>
    }
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1rem;
        max-width: 900px;
        margin: 0 auto;
      }
      .breadcrumb {
        font-size: 0.85rem;
        color: var(--text-3);
        display: flex;
        gap: 0.4rem;
      }
      .breadcrumb a {
        color: var(--accent);
        text-decoration: none;
      }
      .header {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1.25rem;
      }
      .header h1 {
        margin: 0 0 0.5rem;
      }
      .desc {
        margin: 0 0 0.5rem;
        color: var(--text-2);
      }
      .stats {
        margin: 0;
        color: var(--text-3);
        font-size: 0.85rem;
      }
      .actions {
        margin-top: 0.75rem;
        display: flex;
        gap: 0.5rem;
      }
      .btn {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        text-decoration: none;
        font-weight: 600;
      }
      .btn.primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      .rules {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 0.85rem 1rem;
      }
      .sort-row {
        color: var(--text-2);
      }
      .sort-row select {
        margin-left: 0.5rem;
        padding: 0.4rem 0.6rem;
        border-radius: 0.55rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .thread-list {
        display: grid;
        gap: 0.75rem;
      }
      .thread-card {
        padding: 1rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--bg-card);
        display: grid;
        gap: 0.35rem;
      }
      .thread-card h3 {
        margin: 0;
      }
      .thread-card h3 a {
        color: var(--text-1);
        text-decoration: none;
      }
      .meta {
        display: flex;
        gap: 0.5rem;
        color: var(--text-3);
        font-size: 0.85rem;
      }
      .badge {
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
      }
      .badge.pin {
        background: rgba(214, 176, 80, 0.2);
        color: #d4ac6b;
      }
      .badge.closed {
        background: rgba(214, 90, 90, 0.2);
        color: #e49d9d;
      }
      .tags {
        display: flex;
        gap: 0.35rem;
        flex-wrap: wrap;
      }
      .tag {
        font-size: 0.78rem;
        color: var(--accent);
        background: var(--bg-surface);
        padding: 0.15rem 0.55rem;
        border-radius: 0.5rem;
      }
      .empty {
        text-align: center;
        color: var(--text-2);
      }
      .load-more {
        margin: 0 auto;
      }
    `,
  ],
})
export class ForumPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly forumsService = inject(CommunityForumsService);
  private readonly authService = inject(AuthService);
  private readonly md = inject(MarkdownService);

  readonly forum = signal<CommunityForum | null>(null);
  readonly threads = signal<ForumThread[]>([]);
  readonly loading = signal(true);
  readonly threadsLoading = signal(false);
  readonly notFound = signal(false);
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);

  readonly communitySlug = signal('');
  readonly forumSlug = signal('');
  sortBy: ThreadSortBy = 'newest';

  readonly rulesHtml = computed(() => {
    const f = this.forum();
    return f?.rules ? this.md.render(f.rules) : '';
  });

  isAuth() {
    return this.authService.isAuthenticated();
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const cs = params.get('slug') ?? '';
      const fs = params.get('forumSlug') ?? '';
      this.communitySlug.set(cs);
      this.forumSlug.set(fs);
      this.load();
    });
  }

  load() {
    this.loading.set(true);
    this.notFound.set(false);
    this.forumsService.getForum(this.communitySlug(), this.forumSlug()).subscribe({
      next: (f) => {
        this.forum.set(f);
        this.loading.set(false);
        this.loadThreads(true);
      },
      error: (err) => {
        if (err?.status === 404) this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  loadThreads(reset: boolean) {
    this.threadsLoading.set(true);
    const cursor = reset ? null : this.nextCursor();
    this.forumsService
      .listThreads(this.communitySlug(), this.forumSlug(), { sortBy: this.sortBy, cursor })
      .subscribe({
        next: (resp) => {
          this.threads.set(reset ? resp.data : [...this.threads(), ...resp.data]);
          this.nextCursor.set(resp.pagination?.nextCursor ?? null);
          this.hasMore.set(!!resp.pagination?.hasMore);
          this.threadsLoading.set(false);
        },
        error: () => this.threadsLoading.set(false),
      });
  }

  onSortChange() {
    this.loadThreads(true);
  }

  loadMore() {
    this.loadThreads(false);
  }

  join() {
    const f = this.forum();
    if (!f) return;
    this.forumsService.joinForum(this.communitySlug(), f.slug).subscribe({
      next: (r) => {
        this.forum.set({ ...f, isMember: r.isMember, membersCount: r.membersCount });
      },
    });
  }

  relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'hace instantes';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days}d`;
    return `hace ${Math.floor(days / 30)}mes`;
  }
}
