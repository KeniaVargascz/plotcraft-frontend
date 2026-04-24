import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThreadDetail } from '../../core/models/forum-thread.model';
import { ForumReply } from '../../core/models/forum-reply.model';
import { AuthService } from '../../core/services/auth.service';
import { ForumService } from '../../core/services/forum.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { CategoryBadgeComponent } from './components/category-badge.component';
import { ForumReactionBarComponent } from './components/forum-reaction-bar.component';
import { PollWidgetComponent } from './components/poll-widget.component';
import { ReplyItemComponent } from './components/reply-item.component';
import { ReplyComposerComponent } from './components/reply-composer.component';

@Component({
  selector: 'app-thread-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    CategoryBadgeComponent,
    ForumReactionBarComponent,
    PollWidgetComponent,
    ReplyItemComponent,
    ReplyComposerComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-message />
    } @else if (thread(); as t) {
      <section class="thread-page">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a routerLink="/foro">Foro</a>
          <span class="sep">/</span>
          <span>{{ t.title }}</span>
        </nav>

        <!-- Header -->
        <header class="thread-header">
          <div class="header-top">
            <app-category-badge [category]="t.category" />
            @if (t.isPinned) {
              <span class="badge pin">Fijado</span>
            }
            @if (t.status === 'CLOSED') {
              <span class="badge closed">Cerrado</span>
            }
          </div>

          <h1 class="thread-title">{{ t.title }}</h1>

          <div class="thread-meta">
            <div class="author-info">
              @if (t.author.avatarUrl) {
                <img [src]="t.author.avatarUrl" [alt]="t.author.username" class="avatar" />
              } @else {
                <span class="avatar placeholder">{{ t.author.username[0].toUpperCase() }}</span>
              }
              <span class="username">{{ t.author.displayName || t.author.username }}</span>
              <span class="time">{{ relativeTime(t.createdAt) }}</span>
            </div>
            <div class="thread-stats">
              <span>{{ t.stats.repliesCount }} respuestas</span>
              <span>{{ t.viewsCount }} vistas</span>
            </div>
          </div>

          @if (t.tags.length) {
            <div class="tags">
              @for (tag of t.tags; track tag) {
                <span class="tag">#{{ tag }}</span>
              }
            </div>
          }

          @if (isAuthor()) {
            <div class="author-actions">
              @if (!editingThread()) {
                <button type="button" class="act-btn" (click)="startEditThread()">Editar</button>
              }
              @if (t.status === 'CLOSED') {
                <button type="button" class="act-btn" (click)="toggleThreadStatus()">
                  Reabrir
                </button>
              } @else {
                <button type="button" class="act-btn" (click)="toggleThreadStatus()">Cerrar</button>
              }
              <button type="button" class="act-btn danger" (click)="deleteThread()">
                Eliminar
              </button>
            </div>
          }
        </header>

        <!-- Content -->
        @if (editingThread()) {
          <div class="edit-section">
            <textarea [(ngModel)]="editThreadContent" class="edit-textarea" rows="8"></textarea>
            <div class="edit-actions">
              <button type="button" class="save-btn" (click)="saveThreadEdit()">Guardar</button>
              <button type="button" class="cancel-btn" (click)="editingThread.set(false)">
                Cancelar
              </button>
            </div>
          </div>
        } @else {
          <div class="thread-content" [innerHTML]="renderedContent()"></div>
        }

        <!-- Poll -->
        @if (t.poll) {
          <app-poll-widget
            [poll]="t.poll"
            [threadSlug]="slug()"
            [isAuthenticated]="authenticated()"
            (voted)="reload()"
          />
        }

        <!-- Thread Reactions -->
        <app-forum-reaction-bar
          [reactions]="threadReactions()"
          [viewerReaction]="t.viewerContext?.reactionType ?? null"
          [threadSlug]="slug()"
          [replyId]="null"
        />

        <!-- Closed banner -->
        @if (t.status === 'CLOSED') {
          <div class="closed-banner">Este hilo esta cerrado. No se aceptan nuevas respuestas.</div>
        }

        <!-- Replies -->
        <div class="replies-section">
          <h2 class="replies-title">Respuestas ({{ t.replies.length }})</h2>

          <div class="replies-list">
            @for (reply of sortedReplies(); track reply.id) {
              <app-reply-item
                [reply]="reply"
                [allReplies]="allReplies()"
                [threadSlug]="slug()"
                [isThreadAuthor]="isAuthor()"
                [canReply]="!!thread()?.canReply && thread()?.status !== 'CLOSED'"
                (replyAdded)="onReplyAdded($event)"
                (solutionToggle)="reload()"
                (deleted)="onReplyDeleted($event)"
                (updated)="onReplyUpdated($event)"
              />
            }
          </div>

          @if (!sortedReplies().length) {
            <p class="no-replies">Aun no hay respuestas. Se el primero en responder.</p>
          }
        </div>

        <!-- Composer -->
        @if (t.status !== 'CLOSED' && authenticated()) {
          @if (t.canReply) {
            <app-reply-composer
              [threadSlug]="slug()"
              [disabled]="submitting()"
              (submitted)="onSubmitReply($event)"
            />
          } @else {
            <p class="reply-locked">
              Sigue a este usuario o únete a la comunidad para poder comentar.
            </p>
          }
        }
      </section>
    }
  `,
  styles: [
    `
      .thread-page {
        max-width: 820px;
        margin: 0 auto;
        padding: 1.5rem;
        display: grid;
        gap: 1.25rem;
      }
      .breadcrumb {
        font-size: 0.85rem;
        color: var(--text-3);
      }
      .breadcrumb a {
        color: var(--accent);
        text-decoration: none;
      }
      .breadcrumb a:hover {
        text-decoration: underline;
      }
      .sep {
        margin: 0 0.4rem;
      }
      .thread-header {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1.25rem;
      }
      .header-top {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .badge {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
      }
      .badge.pin {
        background: var(--accent);
        color: #fff;
      }
      .badge.closed {
        background: var(--danger);
        color: #fff;
      }
      .thread-title {
        font-size: 1.35rem;
        color: var(--text-1);
        margin: 0 0 0.65rem;
        line-height: 1.4;
      }
      .thread-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: var(--text-2);
      }
      .author-info {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .avatar {
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 50%;
        object-fit: cover;
      }
      .avatar.placeholder {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--accent);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .username {
        font-weight: 500;
        color: var(--text-1);
      }
      .time {
        color: var(--text-3);
      }
      .thread-stats {
        display: flex;
        gap: 0.75rem;
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.65rem;
      }
      .tag {
        font-size: 0.8rem;
        color: var(--accent);
        background: var(--bg-surface);
        padding: 0.2rem 0.55rem;
        border-radius: 0.5rem;
      }
      .author-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }
      .act-btn {
        padding: 0.3rem 0.75rem;
        border-radius: 0.55rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        font-size: 0.8rem;
        cursor: pointer;
      }
      .act-btn:hover {
        border-color: var(--accent);
      }
      .act-btn.danger:hover {
        border-color: var(--danger);
        color: var(--danger);
      }
      .thread-content {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1.25rem;
        color: var(--text-1);
        font-size: 0.95rem;
        line-height: 1.7;
      }
      .thread-content :first-child {
        margin-top: 0;
      }
      .thread-content :last-child {
        margin-bottom: 0;
      }
      .edit-section {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1rem;
      }
      .edit-textarea {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 0.65rem;
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.75rem;
        font-family: inherit;
        font-size: 0.9rem;
        resize: vertical;
      }
      .edit-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .save-btn {
        padding: 0.4rem 1rem;
        border-radius: 0.65rem;
        border: none;
        background: var(--accent);
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }
      .cancel-btn {
        padding: 0.4rem 1rem;
        border-radius: 0.65rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        cursor: pointer;
      }
      .closed-banner {
        background: var(--bg-surface);
        border: 1px solid var(--danger);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        color: var(--danger);
        font-size: 0.9rem;
        text-align: center;
      }
      .reply-locked {
        margin: 0;
        padding: 0.85rem 1rem;
        border: 1px dashed var(--border);
        border-radius: 0.75rem;
        background: var(--bg-surface);
        color: var(--text-2);
        font-size: 0.88rem;
        text-align: center;
      }
      .replies-section {
        display: grid;
        gap: 0.75rem;
      }
      .replies-title {
        font-size: 1.1rem;
        color: var(--text-1);
        margin: 0;
      }
      .replies-list {
        display: grid;
        gap: 0.65rem;
      }
      .no-replies {
        text-align: center;
        color: var(--text-3);
        padding: 1.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreadDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly forumService = inject(ForumService);
  private readonly authService = inject(AuthService);
  private readonly md = inject(MarkdownService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly thread = signal<ThreadDetail | null>(null);
  readonly submitting = signal(false);
  readonly editingThread = signal(false);
  editThreadContent = '';

  readonly slug = signal('');

  readonly authenticated = computed(() => this.authService.isAuthenticated());

  readonly isAuthor = computed(() => {
    const t = this.thread();
    const user = this.authService.getCurrentUserSnapshot();
    return !!t && !!user && t.author.username === user.username;
  });

  readonly sortedReplies = computed(() => {
    const t = this.thread();
    if (!t) return [];
    const topLevel = t.replies.filter((r) => !r.parentReplyId);
    const solution = topLevel.filter((r) => r.isSolution);
    const rest = topLevel.filter((r) => !r.isSolution);
    return [...solution, ...rest];
  });

  readonly allReplies = computed(() => this.thread()?.replies ?? []);

  readonly threadReactions = computed(() => {
    const t = this.thread();
    if (!t) return {};
    // Build reactions from stats - the thread model doesn't have byType at top level,
    // so we return an empty record (reactions are tracked via viewerContext)
    return {} as Record<string, number>;
  });

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug') ?? '';
      this.slug.set(slug);
      this.loadThread(slug);
    });
  }

  renderedContent = computed(() => {
    const t = this.thread();
    return t ? this.md.render(t.content) : '';
  });

  relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days}d`;
    return `hace ${Math.floor(days / 30)}mes`;
  }

  startEditThread() {
    this.editThreadContent = this.thread()?.content ?? '';
    this.editingThread.set(true);
  }

  saveThreadEdit() {
    const content = this.editThreadContent.trim();
    if (!content) return;
    this.forumService.updateThread(this.slug(), { content }).subscribe((updated) => {
      this.thread.set(updated);
      this.editingThread.set(false);
    });
  }

  toggleThreadStatus() {
    const t = this.thread();
    if (!t) return;
    const obs =
      t.status === 'CLOSED'
        ? this.forumService.openThread(this.slug())
        : this.forumService.closeThread(this.slug());
    obs.subscribe((updated) => this.thread.set(updated));
  }

  deleteThread() {
    if (!confirm('Eliminar este hilo?')) return;
    this.forumService.deleteThread(this.slug()).subscribe(() => {
      void this.router.navigateByUrl('/foro');
    });
  }

  onSubmitReply(content: string) {
    this.submitting.set(true);
    this.forumService.createReply(this.slug(), { content }).subscribe({
      next: (reply) => {
        const t = this.thread();
        if (t) {
          this.thread.set({ ...t, replies: [...t.replies, reply] });
        }
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }

  onReplyAdded(reply: ForumReply) {
    const t = this.thread();
    if (!t) return;
    this.thread.set({ ...t, replies: [...t.replies, reply] });
  }

  onReplyDeleted(replyId: string) {
    const t = this.thread();
    if (!t) return;
    this.thread.set({
      ...t,
      replies: t.replies.map((r) => (r.id === replyId ? { ...r, isDeleted: true } : r)),
    });
  }

  onReplyUpdated(updated: ForumReply) {
    const t = this.thread();
    if (!t) return;
    this.thread.set({
      ...t,
      replies: t.replies.map((r) => (r.id === updated.id ? updated : r)),
    });
  }

  reload() {
    this.loadThread(this.slug());
  }

  private loadThread(slug: string) {
    this.loading.set(true);
    this.error.set(false);
    this.forumService
      .getThread(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (thread) => {
          this.thread.set(thread);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
