import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ForumReply } from '../../../core/models/forum-reply.model';
import { ForumService } from '../../../core/services/forum.service';
import { MarkdownService } from '../../../core/services/markdown.service';
import { ForumReactionBarComponent } from './forum-reaction-bar.component';

@Component({
  selector: 'app-reply-item',
  standalone: true,
  imports: [FormsModule, ForumReactionBarComponent],
  template: `
    @if (reply().isDeleted) {
      <div class="reply deleted">
        <p class="deleted-text">[Respuesta eliminada]</p>
      </div>
    } @else {
      <div class="reply" [class.solution]="reply().isSolution">
        @if (reply().isSolution) {
          <div class="solution-label">&#10003; Solucion</div>
        }

        <div class="reply-header">
          <div class="author">
            @if (reply().author.avatarUrl) {
              <img [src]="reply().author.avatarUrl" [alt]="reply().author.username" class="avatar" />
            } @else {
              <span class="avatar placeholder">{{ reply().author.username[0].toUpperCase() }}</span>
            }
            <span class="username">{{ reply().author.displayName || reply().author.username }}</span>
            <span class="time">{{ relativeTime() }}</span>
          </div>

          <div class="actions">
            @if (!editing()) {
              <button type="button" class="action-btn" (click)="startEdit()">Editar</button>
              <button type="button" class="action-btn danger" (click)="remove()">Eliminar</button>
            }
            @if (isThreadAuthor()) {
              @if (reply().isSolution) {
                <button type="button" class="action-btn" (click)="toggleSolution()">Quitar solucion</button>
              } @else {
                <button type="button" class="action-btn accent" (click)="toggleSolution()">Marcar solucion</button>
              }
            }
          </div>
        </div>

        @if (editing()) {
          <div class="edit-area">
            <textarea
              [(ngModel)]="editContent"
              class="edit-textarea"
              rows="4"
            ></textarea>
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
      </div>
    }
  `,
  styles: [`
    .reply {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 1rem 1.25rem;
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
    .username { font-weight: 500; color: var(--text-1); }
    .time { color: var(--text-3); }
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
    .action-btn:hover { border-color: var(--accent); }
    .action-btn.danger:hover { border-color: var(--danger); color: var(--danger); }
    .action-btn.accent { color: var(--accent); border-color: var(--accent); }
    .content {
      color: var(--text-1);
      font-size: 0.9rem;
      line-height: 1.65;
      margin-bottom: 0.75rem;
    }
    .content :first-child { margin-top: 0; }
    .content :last-child { margin-bottom: 0; }
    .edit-area { margin-bottom: 0.75rem; }
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
  `],
})
export class ReplyItemComponent {
  private readonly forumService = inject(ForumService);
  private readonly md = inject(MarkdownService);

  readonly reply = input.required<ForumReply>();
  readonly threadSlug = input.required<string>();
  readonly isThreadAuthor = input(false);

  readonly solutionToggle = output<string>();
  readonly deleted = output<string>();
  readonly updated = output<ForumReply>();

  readonly editing = signal(false);
  editContent = '';

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
}
