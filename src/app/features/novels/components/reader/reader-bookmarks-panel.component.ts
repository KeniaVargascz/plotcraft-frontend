import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReaderBookmark } from '../../../../core/models/bookmark.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reader-bookmarks-panel',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="panel bookmarks-panel">
      <div class="prefs-header">
        <h3>{{ 'reader.bookmarksPanel.title' | translate }}</h3>
        <button
          type="button"
          class="prefs-close"
          aria-label="Cerrar"
          (click)="closed.emit()"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      @if (!bookmarks().length) {
        <p>{{ 'reader.bookmarksPanel.empty' | translate }}</p>
      } @else {
        @for (bookmark of bookmarks(); track bookmark.id) {
          <div class="panel-row">
            <button
              type="button"
              class="bookmark-link"
              (click)="scrollToBookmark.emit(bookmark.anchorId)"
            >
              {{ bookmark.label || bookmark.anchorId || bookmark.chapter.title }}
            </button>
            <button type="button" (click)="removeBookmark.emit(bookmark.id)">
              {{ 'reader.bookmarksPanel.remove' | translate }}
            </button>
          </div>
        }
      }
    </aside>
  `,
  styles: [
    `
      .panel {
        width: min(300px, 100%);
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1.5rem;
      }
      .bookmarks-panel {
        scroll-margin-top: 5rem;
      }
      .panel-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .bookmark-link {
        background: transparent;
        border: 0;
        color: var(--accent-text);
        padding: 0;
        cursor: pointer;
        text-align: left;
        font-size: inherit;
        min-height: auto;
      }
      .bookmark-link:hover {
        color: var(--accent);
        text-decoration: underline;
      }
      .prefs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .prefs-header h3 {
        margin: 0;
      }
      .prefs-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        min-height: 32px;
        padding: 0;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        cursor: pointer;
      }
      .prefs-close:hover {
        color: var(--accent-text);
        border-color: var(--accent-text);
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
export class ReaderBookmarksPanelComponent {
  readonly bookmarks = input.required<ReaderBookmark[]>();

  readonly closed = output<void>();
  readonly scrollToBookmark = output<string | null>();
  readonly removeBookmark = output<string>();
}
