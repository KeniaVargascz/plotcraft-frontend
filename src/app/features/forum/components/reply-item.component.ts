import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ForumReply } from '../../../core/models/forum-reply.model';
import { AuthService } from '../../../core/services/auth.service';
import { ForumService } from '../../../core/services/forum.service';
import { MarkdownService } from '../../../core/services/markdown.service';
import { ForumReactionBarComponent } from './forum-reaction-bar.component';

@Component({
  selector: 'app-reply-item',
  standalone: true,
  imports: [FormsModule, ForumReactionBarComponent, ReplyItemComponent],
  template: `
    @if (reply().isDeleted) {
      <div class="reply deleted" [class.is-child]="!!parentAuthor()">
        <p class="deleted-text">[Respuesta eliminada]</p>
      </div>
    } @else {
      <div class="reply" [class.solution]="reply().isSolution" [class.is-child]="!!parentAuthor()">
        @if (parentAuthor()) {
          <div class="reply-to">
            ↳ Respondiendo a <strong>&#64;{{ parentAuthor() }}</strong>
          </div>
        }
        @if (reply().isSolution) {
          <div class="solution-label">&#10003; Solucion</div>
        }

        <div class="reply-header">
          <div class="author">
            @if (reply().author.avatarUrl) {
              <img
                [src]="reply().author.avatarUrl"
                [alt]="reply().author.username"
                class="avatar"
                loading="lazy"
              />
            } @else {
              <span class="avatar placeholder">{{ reply().author.username[0].toUpperCase() }}</span>
            }
            <span class="username">{{
              reply().author.displayName || reply().author.username
            }}</span>
            <span class="time">{{ relativeTime() }}</span>
          </div>

          <div class="actions">
            @if (!editing()) {
              @if (canReply()) {
                <button type="button" class="action-btn" (click)="toggleReplyBox()">
                  {{ replying() ? 'Cancelar' : 'Responder' }}
                </button>
              }
              @if (isOwnReply()) {
                <button type="button" class="action-btn" (click)="startEdit()">Editar</button>
                <button type="button" class="action-btn danger" (click)="remove()">Eliminar</button>
              }
            }
            @if (isThreadAuthor()) {
              @if (reply().isSolution) {
                <button type="button" class="action-btn" (click)="toggleSolution()">
                  Quitar solucion
                </button>
              } @else {
                <button type="button" class="action-btn accent" (click)="toggleSolution()">
                  Marcar solucion
                </button>
              }
            }
          </div>
        </div>

        @if (editing()) {
          <div class="edit-area">
            <textarea [(ngModel)]="editContent" class="edit-textarea" rows="4"></textarea>
            <div class="edit-actions">
              <button type="button" class="save-btn" (click)="saveEdit()">Guardar</button>
              <button type="button" class="cancel-btn" (click)="cancelEdit()">Cancelar</button>
            </div>
          </div>
        } @else {
          <div class="content" [innerHTML]="renderedContent()"></div>
        }

        <app-forum-reaction-bar
          [reactions]="reply().reactions.byType"
          [viewerReaction]="reply().viewerContext?.reactionType ?? null"
          [threadSlug]="threadSlug()"
          [replyId]="reply().id"
        />

        @if (replying()) {
          <div class="reply-box">
            <textarea
              [(ngModel)]="replyContent"
              class="edit-textarea"
              rows="3"
              placeholder="Escribe tu respuesta..."
            ></textarea>
            <div class="edit-actions">
              <button
                type="button"
                class="save-btn"
                (click)="submitReply()"
                [disabled]="submittingReply()"
              >
                {{ submittingReply() ? 'Enviando...' : 'Responder' }}
              </button>
              <button type="button" class="cancel-btn" (click)="toggleReplyBox()">Cancelar</button>
            </div>
          </div>
        }

        @if (children().length) {
          <div class="children">
            @for (child of children(); track child.id) {
              <app-reply-item
                [reply]="child"
                [allReplies]="allReplies()"
                [threadSlug]="threadSlug()"
                [isThreadAuthor]="isThreadAuthor()"
                [canReply]="canReply()"
                [depth]="depth() + 1"
                (replyAdded)="replyAdded.emit($event)"
                (solutionToggle)="solutionToggle.emit($event)"
                (deleted)="deleted.emit($event)"
                (updated)="updated.emit($event)"
              />
            }
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .reply {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        padding: 1rem 1.25rem;
      }
      .reply.is-child {
        background: var(--bg-surface);
        border-style: dashed;
        padding: 0.75rem 1rem;
        font-size: 0.92em;
      }
      .reply-to {
        font-size: 0.75rem;
        color: var(--accent);
        margin-bottom: 0.4rem;
        font-weight: 600;
      }
      .reply.solution {
        border-color: #16a34a;
        border-left: 3px solid #16a34a;
      }
      .solution-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #16a34a;
        margin-bottom: 0.5rem;
      }
      .deleted {
        opacity: 0.5;
        background: var(--bg-surface);
      }
      .deleted-text {
        color: var(--text-3);
        font-style: italic;
        margin: 0;
      }
      .reply-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.65rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .author {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
      }
      .avatar {
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 50%;
        object-fit: cover;
      }
      .avatar.placeholder {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--accent);
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
      }
      .username {
        font-weight: 500;
        color: var(--text-1);
      }
      .time {
        color: var(--text-3);
      }
      .actions {
        display: flex;
        gap: 0.4rem;
      }
      .action-btn {
        padding: 0.25rem 0.6rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        font-size: 0.75rem;
        cursor: pointer;
      }
      .action-btn:hover {
        border-color: var(--accent);
      }
      .action-btn.danger:hover {
        border-color: var(--danger);
        color: var(--danger);
      }
      .action-btn.accent {
        color: var(--accent);
        border-color: var(--accent);
      }
      .content {
        color: var(--text-1);
        font-size: 0.9rem;
        line-height: 1.65;
        margin-bottom: 0.75rem;
      }
      .content :first-child {
        margin-top: 0;
      }
      .content :last-child {
        margin-bottom: 0;
      }
      .edit-area {
        margin-bottom: 0.75rem;
      }
      .edit-textarea {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 0.65rem;
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.65rem;
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
      .reply-box {
        margin-top: 0.5rem;
      }
      .children {
        margin-top: 0.85rem;
        padding-left: 1rem;
        border-left: 2px solid var(--border);
        display: grid;
        gap: 0.65rem;
      }
    `,
  ],
})
export class ReplyItemComponent {
  private readonly forumService = inject(ForumService);
  private readonly md = inject(MarkdownService);
  private readonly authService = inject(AuthService);

  readonly reply = input.required<ForumReply>();
  readonly allReplies = input<ForumReply[]>([]);
  readonly threadSlug = input.required<string>();
  readonly isThreadAuthor = input(false);
  readonly canReply = input(true);
  readonly depth = input(0);

  readonly solutionToggle = output<string>();
  readonly deleted = output<string>();
  readonly updated = output<ForumReply>();
  readonly replyAdded = output<ForumReply>();

  readonly editing = signal(false);
  readonly replying = signal(false);
  readonly submittingReply = signal(false);
  editContent = '';
  replyContent = '';

  readonly children = computed(() => {
    const depth = this.depth();
    const all = this.allReplies();
    if (depth === 0) {
      // Level 0 -> render direct children as level 1 cards
      return all.filter((r) => r.parentReplyId === this.reply().id);
    }
    if (depth === 1) {
      // Level 1 -> flatten ALL descendants beneath this reply as level-2 siblings
      const descendants: ForumReply[] = [];
      const queue = [this.reply().id];
      while (queue.length) {
        const id = queue.shift()!;
        for (const r of all) {
          if (r.parentReplyId === id) {
            descendants.push(r);
            queue.push(r.id);
          }
        }
      }
      return descendants;
    }
    return [];
  });

  readonly isOwnReply = computed(() => {
    const me = this.authService.getCurrentUserSnapshot();
    return !!me && me.username === this.reply().author.username;
  });

  readonly parentAuthor = computed(() => {
    const pid = this.reply().parentReplyId;
    if (!pid) return null;
    const parent = this.allReplies().find((r) => r.id === pid);
    return parent?.author.username ?? null;
  });

  renderedContent = computed(() => this.md.render(this.reply().content));

  relativeTime() {
    const date = new Date(this.reply().createdAt);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days}d`;
    return `hace ${Math.floor(days / 30)}mes`;
  }

  startEdit() {
    this.editContent = this.reply().content;
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
  }

  saveEdit() {
    const content = this.editContent.trim();
    if (!content) return;
    this.forumService
      .updateReply(this.threadSlug(), this.reply().id, { content })
      .subscribe((updated) => {
        this.editing.set(false);
        this.updated.emit(updated);
      });
  }

  remove() {
    if (!confirm('Eliminar esta respuesta?')) return;
    this.forumService
      .deleteReply(this.threadSlug(), this.reply().id)
      .subscribe(() => this.deleted.emit(this.reply().id));
  }

  toggleSolution() {
    const id = this.reply().id;
    const obs = this.reply().isSolution
      ? this.forumService.unmarkSolution(this.threadSlug(), id)
      : this.forumService.markSolution(this.threadSlug(), id);
    obs.subscribe(() => this.solutionToggle.emit(id));
  }

  toggleReplyBox() {
    this.replying.update((v) => !v);
    if (!this.replying()) this.replyContent = '';
  }

  submitReply() {
    const content = this.replyContent.trim();
    if (!content) return;
    this.submittingReply.set(true);
    this.forumService
      .createReply(this.threadSlug(), { content, parentReplyId: this.reply().id })
      .subscribe({
        next: (r) => {
          this.submittingReply.set(false);
          this.replying.set(false);
          this.replyContent = '';
          this.replyAdded.emit(r);
        },
        error: () => this.submittingReply.set(false),
      });
  }
}
