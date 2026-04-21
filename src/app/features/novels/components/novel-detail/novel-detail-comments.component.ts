import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RelativeDatePipe } from '../../../../shared/pipes/relative-date.pipe';

export interface NovelComment {
  id: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

@Component({
  selector: 'app-novel-detail-comments',
  standalone: true,
  imports: [FormsModule, RouterLink, RelativeDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="novel-comments">
      <h2>Comentarios</h2>

      @if (commentsEnabled()) {
        @if (isAuthenticated()) {
          <div class="comment-form">
            <textarea
              rows="3"
              placeholder="Escribe un comentario..."
              [ngModel]="commentText()"
              (ngModelChange)="commentTextChange.emit($event)"
            ></textarea>
            <button
              class="btn-send"
              [disabled]="commentSending() || !commentText().trim()"
              (click)="addComment.emit(commentText())"
            >
              {{ commentSending() ? 'Enviando...' : 'Comentar' }}
            </button>
          </div>
        }

        @if (loading() && !comments().length) {
          <p class="comment-hint">Cargando comentarios...</p>
        } @else if (!comments().length) {
          <p class="comment-hint">Aun no hay comentarios. Se el primero!</p>
        } @else {
          <div class="comments-list">
            @for (c of comments(); track c.id) {
              <div class="comment-item">
                <div class="comment-avatar">
                  {{ (c.author.displayName || c.author.username).charAt(0).toUpperCase() }}
                </div>
                <div class="comment-body">
                  <div class="comment-header">
                    <a class="comment-author" [routerLink]="['/@' + c.author.username]">
                      {{ c.author.displayName || '@' + c.author.username }}
                    </a>
                    <span class="comment-date">{{ c.createdAt | relativeDate }}</span>
                    @if (isAuthor()) {
                      <button
                        class="comment-delete"
                        title="Eliminar comentario"
                        (click)="deleteComment.emit(c.id)"
                      >
                        &#10005;
                      </button>
                    }
                  </div>
                  <p class="comment-text">{{ c.content }}</p>
                </div>
              </div>
            }
          </div>

          @if (hasMore()) {
            <button
              class="btn-load-more"
              [disabled]="loading()"
              (click)="loadMore.emit()"
            >
              {{ loading() ? 'Cargando...' : 'Ver mas comentarios' }}
            </button>
          }
        }
      } @else {
        <p class="comment-hint">Los comentarios estan desactivados para esta novela.</p>
      }
    </section>
  `,
  styles: [
    `
      .novel-comments {
        display: grid;
        gap: 1rem;
      }
      .novel-comments h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      .comment-form {
        display: grid;
        gap: 0.5rem;
      }
      .comment-form textarea {
        width: 100%;
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.85rem;
        font-family: inherit;
        resize: vertical;
      }
      .comment-form textarea:focus {
        outline: none;
        border-color: var(--accent);
      }
      .btn-send {
        justify-self: end;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        border: none;
        background: var(--accent);
        color: #fff;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        min-height: unset;
      }
      .btn-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .comment-hint {
        color: var(--text-3);
        font-size: 0.85rem;
        text-align: center;
        padding: 1rem;
        margin: 0;
      }
      .comments-list {
        display: grid;
        gap: 0.75rem;
      }
      .comment-item {
        display: flex;
        gap: 0.6rem;
      }
      .comment-avatar {
        width: 2rem;
        height: 2rem;
        min-width: 2rem;
        border-radius: 50%;
        background: var(--accent-glow);
        color: var(--accent-text);
        display: grid;
        place-items: center;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .comment-body {
        flex: 1;
        min-width: 0;
      }
      .comment-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .comment-author {
        font-weight: 600;
        font-size: 0.85rem;
        color: var(--text-1);
        text-decoration: none;
      }
      .comment-author:hover {
        color: var(--accent-text);
      }
      .comment-date {
        color: var(--text-3);
        font-size: 0.78rem;
      }
      .comment-delete {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.6rem;
        height: 1.6rem;
        min-height: unset;
        border: none;
        border-radius: 50%;
        background: none;
        color: var(--text-3);
        cursor: pointer;
        padding: 0;
      }
      .comment-delete:hover {
        color: #e55;
        background: var(--bg-surface);
      }
      .comment-text {
        margin: 0.2rem 0 0;
        color: var(--text-2);
        font-size: 0.85rem;
        line-height: 1.5;
      }
      .btn-load-more {
        display: block;
        margin: 0 auto;
        padding: 0.5rem 1.2rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font-size: 0.85rem;
        min-height: unset;
      }
      .btn-load-more:hover {
        border-color: var(--accent);
      }
    `,
  ],
})
export class NovelDetailCommentsComponent {
  readonly comments = input.required<NovelComment[]>();
  readonly loading = input<boolean>(false);
  readonly hasMore = input<boolean>(false);
  readonly isAuthenticated = input<boolean>(false);
  readonly isAuthor = input<boolean>(false);
  readonly commentsEnabled = input<boolean>(true);
  readonly commentText = input<string>('');
  readonly commentSending = input<boolean>(false);

  readonly addComment = output<string>();
  readonly deleteComment = output<string>();
  readonly loadMore = output();
  readonly commentTextChange = output<string>();
}
