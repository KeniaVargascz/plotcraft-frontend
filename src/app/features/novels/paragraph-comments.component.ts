import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChaptersService, ChapterCommentModel } from '../../core/services/chapters.service';

@Component({
  selector: 'app-paragraph-comments',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="p-overlay" (click)="closed.emit()">
      <div class="p-dialog" (click)="$event.stopPropagation()">
        <div class="p-dialog-header">
          <strong>Comentarios del párrafo</strong>
          <button class="p-dialog-close" (click)="closed.emit()">✕</button>
        </div>

        <div class="p-dialog-body">
          @if (!comments().length && !quotedText) {
            <p class="p-hint">Sin comentarios en este párrafo.</p>
          }

          <div class="p-comments-list">
            @for (c of comments(); track c.id) {
              <div class="p-comment-item">
                @if (c.quotedText) {
                  <blockquote class="p-comment-quote">{{ truncateQuote(c.quotedText) }}</blockquote>
                }
                <div class="p-comment-body">
                  <div class="p-comment-top-row">
                    <a class="p-comment-author" [routerLink]="['/@' + c.author.username]">
                      {{ c.author.displayName || '@' + c.author.username }}
                    </a>
                    <span class="p-comment-date">{{ relativeDate(c.createdAt) }}</span>
                    @if (canDelete(c)) {
                      <button class="p-comment-delete" (click)="removeComment(c.id)">✕</button>
                    }
                  </div>
                  <p class="p-comment-text">{{ c.content }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        @if (isAuthenticated && commentsEnabled) {
          <div class="p-dialog-footer">
            @if (quotedText) {
              <blockquote class="p-new-quote">{{ truncateQuote(quotedText) }}</blockquote>
            }
            <div class="p-comment-form">
              <textarea
                rows="2"
                placeholder="Escribe tu comentario…"
                [(ngModel)]="newComment"
                maxlength="2000"
              ></textarea>
              <button
                class="p-btn-send"
                [disabled]="sending() || !newComment.trim()"
                (click)="submitComment()"
              >
                {{ sending() ? 'Enviando…' : 'Comentar' }}
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .p-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.45);
        display: grid;
        place-items: center;
        padding: 1rem;
        animation: p-fade-in 0.15s ease-out;
      }
      @keyframes p-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes p-slide-up {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .p-dialog {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 1rem;
        width: 100%;
        max-width: 480px;
        max-height: 80vh;
        display: grid;
        grid-template-rows: auto 1fr auto;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
        animation: p-slide-up 0.2s ease-out;
        overflow: hidden;
      }
      .p-dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--border);
        font-size: 0.9rem;
      }
      .p-dialog-close {
        background: none;
        border: none;
        color: var(--text-3);
        cursor: pointer;
        font-size: 1.1rem;
        padding: 0.2rem;
        min-height: unset;
        line-height: 1;
        border-radius: 50%;
        width: 1.8rem;
        height: 1.8rem;
        display: grid;
        place-items: center;
      }
      .p-dialog-close:hover {
        background: var(--bg);
        color: var(--text-1);
      }
      .p-dialog-body {
        padding: 0.75rem 1rem;
        overflow-y: auto;
        display: grid;
        gap: 0.5rem;
        align-content: start;
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--accent) 38%, var(--border)) transparent;
      }
      .p-dialog-body::-webkit-scrollbar {
        width: 6px;
      }
      .p-dialog-body::-webkit-scrollbar-track {
        background: transparent;
      }
      .p-dialog-body::-webkit-scrollbar-thumb {
        background: color-mix(in srgb, var(--accent) 38%, var(--border));
        border-radius: 3px;
      }
      .p-dialog-body::-webkit-scrollbar-thumb:hover {
        background: var(--accent);
      }
      .p-dialog-footer {
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--border);
        display: grid;
        gap: 0.5rem;
      }
      .p-hint {
        color: var(--text-3);
        font-size: 0.82rem;
        text-align: center;
        margin: 1rem 0;
      }
      .p-comments-list {
        display: grid;
        gap: 0;
      }
      .p-comment-item {
        display: grid;
        gap: 0.3rem;
        padding: 0.6rem 0;
        border-bottom: 1px solid var(--border);
      }
      .p-comment-item:last-child {
        border-bottom: none;
      }
      .p-comment-quote,
      .p-new-quote {
        margin: 0;
        padding: 0.4rem 0.65rem;
        border-left: 3px solid var(--accent);
        background: var(--accent-glow);
        font-size: 0.78rem;
        font-style: italic;
        color: var(--text-2);
        border-radius: 0 0.4rem 0.4rem 0;
        line-height: 1.5;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      .p-comment-body {
        display: grid;
        gap: 0.2rem;
      }
      .p-comment-top-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .p-comment-author {
        font-weight: 600;
        font-size: 0.82rem;
        color: var(--text-1);
        text-decoration: none;
        white-space: nowrap;
        min-height: unset;
      }
      .p-comment-author:hover {
        color: var(--accent-text);
      }
      .p-comment-date {
        color: var(--text-3);
        font-size: 0.73rem;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .p-comment-delete {
        background: none;
        border: none;
        color: var(--text-3);
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.1rem 0.25rem;
        min-height: unset;
        line-height: 1;
        border-radius: 4px;
        flex-shrink: 0;
        margin-left: auto;
      }
      .p-comment-delete:hover {
        color: #e55;
        background: rgba(229, 85, 85, 0.1);
      }
      .p-comment-text {
        margin: 0;
        font-size: 0.82rem;
        color: var(--text-2);
        line-height: 1.55;
      }
      .p-comment-form {
        display: grid;
        gap: 0.4rem;
      }
      .p-comment-form textarea {
        width: 100%;
        padding: 0.55rem 0.65rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg);
        color: var(--text-1);
        font-size: 0.82rem;
        font-family: inherit;
        resize: vertical;
      }
      .p-comment-form textarea:focus {
        outline: none;
        border-color: var(--accent);
      }
      .p-btn-send {
        justify-self: end;
        padding: 0.4rem 1rem;
        border-radius: 999px;
        border: none;
        background: var(--accent);
        color: #fff;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        min-height: unset;
      }
      .p-btn-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ParagraphCommentsComponent implements OnChanges {
  @Input() novelSlug!: string;
  @Input() chapterSlug!: string;
  @Input() anchorId!: string;
  @Input() isAuthenticated = false;
  @Input() currentUserId: string | null = null;
  @Input() currentUserUsername: string | null = null;
  @Input() novelAuthorUsername = '';
  @Input() commentsEnabled = true;
  @Input() quotedText: string | null = null;
  @Input() startOffset = 0;
  @Input() endOffset = 0;
  /** Pre-loaded comments from the reader (filtered by anchorId) */
  @Input() initialComments: ChapterCommentModel[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() commentAdded = new EventEmitter<void>();
  @Output() commentRemoved = new EventEmitter<void>();

  private chaptersService = inject(ChaptersService);

  readonly comments = signal<ChapterCommentModel[]>([]);
  readonly sending = signal(false);
  newComment = '';

  ngOnChanges() {
    this.comments.set(this.initialComments);
  }

  submitComment() {
    const text = this.newComment.trim();
    if (!text || this.sending()) return;
    this.sending.set(true);
    const quote = this.quotedText?.trim() || '';
    const trimmedQuote = quote.length > 200 ? quote.slice(0, 200) + '…' : quote;
    const payload = {
      content: text,
      anchorId: this.anchorId,
      quoted_text: trimmedQuote || '',
      startOffset: this.startOffset ?? 0,
      endOffset: this.endOffset ?? 0,
    };
    this.chaptersService
      .createParagraphComment(this.novelSlug, this.chapterSlug, payload)
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.commentAdded.emit();
          this.closed.emit();
        },
        error: () => this.sending.set(false),
      });
  }

  removeComment(commentId: string) {
    this.chaptersService
      .deleteChapterComment(this.novelSlug, this.chapterSlug, commentId)
      .subscribe({
        next: () => {
          this.comments.update((prev) => prev.filter((c) => c.id !== commentId));
          this.commentRemoved.emit();
        },
      });
  }

  canDelete(comment: ChapterCommentModel): boolean {
    if (!this.currentUserId) return false;
    return (
      comment.author.id === this.currentUserId ||
      this.novelAuthorUsername === this.currentUserUsername
    );
  }

  truncateQuote(text: string, max = 150): string {
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + '…';
  }

  relativeDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}
