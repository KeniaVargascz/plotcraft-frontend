import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChapterCommentModel } from '../../../../core/services/chapters.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RelativeDatePipe } from '../../../../shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-reader-comments-section',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, RelativeDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="chapter-comments card" data-testid="chapter-comments">
      <h2>{{ 'reader.comments.title' | translate }}</h2>

      @if (commentsEnabled()) {
        @if (isAuthenticated()) {
          <div class="comment-form">
            <textarea
              [(ngModel)]="commentText"
              rows="3"
              [placeholder]="'reader.comments.placeholder' | translate"
              maxlength="2000"
            ></textarea>
            <button
              type="button"
              class="btn-send"
              [disabled]="!commentText.trim() || loading()"
              (click)="onSubmit()"
            >
              {{
                loading()
                  ? ('reader.comments.submitting' | translate)
                  : ('reader.comments.submit' | translate)
              }}
            </button>
          </div>
        } @else {
          <a class="comment-login" routerLink="/login">
            {{ 'reader.comments.loginCta' | translate }}
          </a>
        }

        @if (commentsLoading() && !comments().length) {
          <p class="comment-hint">{{ 'reader.comments.loading' | translate }}</p>
        } @else if (!comments().length) {
          <p class="comment-hint">{{ 'reader.comments.empty' | translate }}</p>
        } @else {
          <div class="comments-list">
            @for (c of comments(); track c.id) {
              <div class="comment-item">
                <div class="comment-avatar">{{ c.author.username[0].toUpperCase() }}</div>
                <div class="comment-body">
                  <div class="comment-header">
                    <a [routerLink]="['/perfil', c.author.username]" class="comment-author">
                      {{ c.author.displayName || c.author.username }}
                    </a>
                    <span class="comment-date">{{ c.createdAt | relativeDate }}</span>
                    @if (deletableIds().has(c.id)) {
                      <button
                        type="button"
                        class="comment-delete"
                        (click)="deleteComment.emit(c.id)"
                        [attr.aria-label]="'reader.comments.deleteAria' | translate"
                      >
                        ✕
                      </button>
                    }
                  </div>
                  <p class="comment-text">{{ c.content }}</p>
                </div>
              </div>
            }
          </div>

          @if (hasMore()) {
            <button type="button" class="btn-load-more" (click)="loadMore.emit()">
              {{ 'reader.comments.loadMore' | translate }}
            </button>
          }
        }
      } @else {
        <p class="comment-hint">{{ 'reader.comments.disabled' | translate }}</p>
      }
    </section>
  `,
  styles: [
    `
      .chapter-comments.card {
        padding: 1.25rem;
        display: grid;
        gap: 1rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1.25rem;
      }
      .chapter-comments h2 {
        margin: 0;
        font-size: 1.15rem;
      }
      .comment-form {
        display: grid;
        gap: 0.5rem;
      }
      .comment-form textarea {
        width: 100%;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.75rem 0.9rem;
        resize: vertical;
        font: inherit;
      }
      .comment-form .btn-send {
        justify-self: end;
        padding: 0.55rem 1rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        border: 1px solid var(--accent-text);
        cursor: pointer;
        font-weight: 600;
      }
      .comment-form .btn-send:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .comment-login {
        display: inline-block;
        align-self: start;
        padding: 0.5rem 0.9rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.85rem;
        text-decoration: none;
        width: fit-content;
      }
      .comment-login:hover {
        color: var(--accent);
      }
      .comment-hint {
        margin: 0;
        color: var(--text-2);
        font-size: 0.9rem;
      }
      .comments-list {
        display: grid;
        gap: 0.85rem;
      }
      .comment-item {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border);
      }
      .comment-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .comment-avatar {
        flex-shrink: 0;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        display: grid;
        place-items: center;
        font-weight: 600;
      }
      .comment-body {
        flex: 1;
        min-width: 0;
      }
      .comment-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.2rem;
      }
      .comment-author {
        color: var(--text-1);
        font-weight: 600;
        text-decoration: none;
        min-height: unset;
        white-space: nowrap;
      }
      .comment-author:hover {
        color: var(--accent-text);
      }
      .comment-date {
        color: var(--text-2);
        font-size: 0.8rem;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .comment-delete {
        margin-left: auto;
        background: transparent;
        border: 1px solid var(--border);
        color: var(--text-2);
        padding: 0.15rem 0.4rem;
        cursor: pointer;
        border-radius: 0.4rem;
        min-height: unset;
        flex-shrink: 0;
      }
      .comment-delete:hover {
        background: var(--bg);
        color: var(--text-1);
      }
      .comment-text {
        margin: 0;
        color: var(--text-1);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .btn-load-more {
        justify-self: center;
        padding: 0.45rem 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
      }
      .btn-load-more:hover {
        border-color: var(--accent-text);
        color: var(--accent-text);
      }
      a {
        color: var(--accent-text);
      }
      button {
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.5rem 0.8rem;
      }
    `,
  ],
})
export class ReaderCommentsSectionComponent {
  readonly comments = input.required<ChapterCommentModel[]>();
  readonly commentsLoading = input.required<boolean>();
  readonly loading = input.required<boolean>();
  readonly hasMore = input.required<boolean>();
  readonly isAuthenticated = input.required<boolean>();
  readonly commentsEnabled = input.required<boolean>();
  readonly deletableIds = input.required<Set<string>>();

  readonly addComment = output<string>();
  readonly deleteComment = output<string>();
  readonly loadMore = output<void>();

  commentText = '';

  onSubmit() {
    const text = this.commentText.trim();
    if (!text) return;
    this.addComment.emit(text);
    this.commentText = '';
  }
}
