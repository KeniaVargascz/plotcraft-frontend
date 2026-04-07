import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CommunityForumsService } from './services/community-forums.service';
import {
  CommunityForum,
  ForumReply,
  ForumThread,
} from './models/community-forum.model';

@Component({
  selector: 'app-community-thread-detail-page',
  standalone: true,
  imports: [RouterLink, FormsModule, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (notFound()) {
      <p class="empty">Hilo no encontrado.</p>
    } @else if (thread(); as t) {
      <section class="page">
        <nav class="breadcrumb">
          <a routerLink="/comunidades">Comunidades</a>
          <span>/</span>
          <a [routerLink]="['/comunidades', communitySlug()]">{{ communitySlug() }}</a>
          <span>/</span>
          <a [routerLink]="['/comunidades', communitySlug(), 'foros', forumSlug()]">
            {{ forum()?.name ?? forumSlug() }}
          </a>
          <span>/</span>
          <span>{{ t.title }}</span>
        </nav>

        <header class="thread-header">
          <div class="badges">
            @if (t.isPinned || t.status === 'PINNED') {
              <span class="badge pin">📌 Fijado</span>
            }
            @if (t.status === 'CLOSED') {
              <span class="badge closed">🔒 Cerrado</span>
            }
          </div>
          <h1>{{ t.title }}</h1>
          <div class="author">
            @if (t.author.avatarUrl) {
              <img [src]="t.author.avatarUrl" [alt]="t.author.username" class="avatar" />
            } @else {
              <span class="avatar ph">{{ t.author.username.charAt(0).toUpperCase() }}</span>
            }
            <div>
              <strong>{{ t.author.displayName }}</strong>
              <span class="muted">&#64;{{ t.author.username }} · {{ relativeTime(t.createdAt) }}</span>
            </div>
          </div>
          <div class="content md" [innerHTML]="contentHtml()"></div>
          @if (t.tags?.length) {
            <div class="tags">
              @for (tag of t.tags; track tag) {
                <span class="tag">#{{ tag }}</span>
              }
            </div>
          }
          <div class="actions">
            <button type="button" class="btn small" (click)="share()">Compartir</button>
          </div>
        </header>

        <section class="replies">
          <h2>Respuestas ({{ replies().length }})</h2>
          @for (r of replies(); track r.id) {
            <article class="reply">
              <div class="author">
                @if (r.author.avatarUrl) {
                  <img [src]="r.author.avatarUrl" [alt]="r.author.username" class="avatar" />
                } @else {
                  <span class="avatar ph">{{ r.author.username.charAt(0).toUpperCase() }}</span>
                }
                <div>
                  <strong>{{ r.author.displayName }}</strong>
                  <span class="muted">&#64;{{ r.author.username }} · {{ relativeTime(r.createdAt) }}</span>
                </div>
              </div>
              <div class="content md" [innerHTML]="renderMd(r.content)"></div>
            </article>
          }
          @if (hasMore()) {
            <button type="button" class="btn" (click)="loadMoreReplies()" [disabled]="loadingReplies()">
              {{ loadingReplies() ? 'Cargando...' : 'Cargar más' }}
            </button>
          }
          @if (replies().length === 0) {
            <p class="muted">Aún no hay respuestas. ¡Sé el primero!</p>
          }
        </section>

        @if (t.status === 'CLOSED') {
          <div class="closed-banner">Este hilo está cerrado. No se aceptan más respuestas.</div>
        } @else if (!isAuth()) {
          <p class="muted center">Inicia sesión para responder.</p>
        } @else if (canReply()) {
          <form class="reply-form" (ngSubmit)="postReply()">
            <textarea
              [(ngModel)]="replyContent"
              name="reply"
              rows="4"
              maxlength="10000"
              placeholder="Escribe tu respuesta..."
            ></textarea>
            <button type="submit" class="btn primary" [disabled]="!replyContent.trim() || posting()">
              {{ posting() ? 'Enviando...' : 'Responder' }}
            </button>
          </form>
        } @else {
          <p class="muted center">Únete al foro para poder responder.</p>
        }
      </section>
    }
  `,
  styles: [
    `
      .page {
        max-width: 820px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .breadcrumb {
        font-size: 0.85rem;
        color: var(--text-3);
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .breadcrumb a {
        color: var(--accent);
        text-decoration: none;
      }
      .thread-header,
      .reply,
      .reply-form {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1.25rem;
      }
      .thread-header h1 {
        margin: 0.5rem 0;
      }
      .badges {
        display: flex;
        gap: 0.4rem;
      }
      .badge {
        font-size: 0.72rem;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        font-weight: 600;
      }
      .badge.pin {
        background: rgba(214, 176, 80, 0.2);
        color: #d4ac6b;
      }
      .badge.closed {
        background: rgba(214, 90, 90, 0.2);
        color: #e49d9d;
      }
      .author {
        display: flex;
        gap: 0.65rem;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .avatar {
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 50%;
        object-fit: cover;
      }
      .avatar.ph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-weight: 700;
      }
      .author strong {
        display: block;
      }
      .muted {
        color: var(--text-3);
        font-size: 0.85rem;
      }
      .content {
        color: var(--text-1);
        line-height: 1.7;
      }
      .tags {
        display: flex;
        gap: 0.35rem;
        flex-wrap: wrap;
        margin-top: 0.65rem;
      }
      .tag {
        font-size: 0.78rem;
        color: var(--accent);
        background: var(--bg-surface);
        padding: 0.15rem 0.55rem;
        border-radius: 0.5rem;
      }
      .actions {
        margin-top: 0.75rem;
      }
      .btn {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font-weight: 600;
      }
      .btn.small {
        padding: 0.35rem 0.75rem;
        font-size: 0.85rem;
      }
      .btn.primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      .btn[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .replies {
        display: grid;
        gap: 0.75rem;
      }
      .reply-form {
        display: grid;
        gap: 0.5rem;
      }
      .reply-form textarea {
        padding: 0.7rem 0.85rem;
        border-radius: 0.65rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-family: inherit;
      }
      .closed-banner {
        background: var(--bg-surface);
        border: 1px solid var(--danger, #e49d9d);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        text-align: center;
        color: var(--danger, #e49d9d);
      }
      .empty,
      .center {
        text-align: center;
      }
    `,
  ],
})
export class CommunityThreadDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CommunityForumsService);
  private readonly authService = inject(AuthService);
  private readonly md = inject(MarkdownService);

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly thread = signal<ForumThread | null>(null);
  readonly forum = signal<CommunityForum | null>(null);
  readonly replies = signal<ForumReply[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);
  readonly loadingReplies = signal(false);
  readonly posting = signal(false);

  readonly communitySlug = signal('');
  readonly forumSlug = signal('');
  readonly threadSlug = signal('');

  replyContent = '';

  readonly contentHtml = computed(() => {
    const t = this.thread();
    return t ? this.md.render(t.content) : '';
  });

  isAuth() {
    return this.authService.isAuthenticated();
  }

  canReply(): boolean {
    return !!this.forum()?.isMember;
  }

  renderMd(content: string) {
    return this.md.render(content);
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const cs = params.get('slug') ?? '';
      const fs = params.get('forumSlug') ?? '';
      const ts = params.get('threadSlug') ?? '';
      this.communitySlug.set(cs);
      this.forumSlug.set(fs);
      this.threadSlug.set(ts);
      this.load();
    });
  }

  load() {
    this.loading.set(true);
    this.notFound.set(false);
    this.service.getForum(this.communitySlug(), this.forumSlug()).subscribe({
      next: (f) => this.forum.set(f),
      error: () => {},
    });
    this.service.getThread(this.communitySlug(), this.forumSlug(), this.threadSlug()).subscribe({
      next: (t) => {
        this.thread.set(t);
        this.loading.set(false);
        this.loadReplies(true);
      },
      error: (err) => {
        if (err?.status === 404) this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  loadReplies(reset: boolean) {
    this.loadingReplies.set(true);
    const cursor = reset ? null : this.nextCursor();
    this.service
      .listReplies(this.communitySlug(), this.forumSlug(), this.threadSlug(), {
        cursor,
        limit: 20,
      })
      .subscribe({
        next: (resp) => {
          this.replies.set(reset ? resp.data : [...this.replies(), ...resp.data]);
          this.nextCursor.set(resp.pagination?.nextCursor ?? null);
          this.hasMore.set(!!resp.pagination?.hasMore);
          this.loadingReplies.set(false);
        },
        error: () => this.loadingReplies.set(false),
      });
  }

  loadMoreReplies() {
    this.loadReplies(false);
  }

  postReply() {
    const content = this.replyContent.trim();
    if (!content) return;
    this.posting.set(true);
    this.service
      .postReply(this.communitySlug(), this.forumSlug(), this.threadSlug(), content)
      .subscribe({
        next: (reply) => {
          this.replies.update((rs) => [...rs, reply]);
          this.replyContent = '';
          this.posting.set(false);
        },
        error: () => this.posting.set(false),
      });
  }

  share() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href);
    }
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
