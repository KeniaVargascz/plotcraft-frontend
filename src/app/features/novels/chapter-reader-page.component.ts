import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  NgZone,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { throttleTime, Subject, fromEvent, auditTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChapterDetail } from '../../core/models/chapter.model';
import { ReaderBookmark } from '../../core/models/bookmark.model';
import { Highlight, HighlightColor } from '../../core/models/highlight.model';
import { ReaderPreferences } from '../../core/models/reader.model';
import { AuthService } from '../../core/services/auth.service';
import { BookmarksService } from '../../core/services/bookmarks.service';
import { ChaptersService, ChapterCommentModel } from '../../core/services/chapters.service';
import { HighlightsService } from '../../core/services/highlights.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { ReaderService } from '../../core/services/reader.service';
import { VotesService } from '../../core/services/votes.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import {
  PromptDialogComponent,
  PromptDialogData,
} from '../../shared/components/prompt-dialog/prompt-dialog.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';
import { ParagraphCommentsComponent } from './paragraph-comments.component';

@Component({
  selector: 'app-chapter-reader-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ErrorMessageComponent,
    LoadingSpinnerComponent,
    TranslatePipe,
    RelativeDatePipe,
    ParagraphCommentsComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-message />
    } @else if (chapter(); as currentChapter) {
      <article class="reader-shell">
        <div class="reader-sticky">
          <header class="reader-topbar">
            <div class="reader-topbar__left">
              <a routerLink="/novelas">{{ 'nav.novels' | translate }}</a>
              <a [routerLink]="['/novelas', currentChapter.novel.slug]">{{
                currentChapter.novel.title
              }}</a>
            </div>

            <div class="reader-topbar__actions">
              @if (!isAuthenticated()) {
                <span class="hint-banner">
                  {{ 'reader.loginHint' | translate }}
                </span>
              } @else {
                <button
                  type="button"
                  class="icon-btn"
                  [attr.aria-label]="'reader.actions.bookmarkPosition' | translate"
                  [title]="
                    bookmarks().length >= MAX_BOOKMARKS_PER_CHAPTER
                      ? 'Maximo ' + MAX_BOOKMARKS_PER_CHAPTER + ' marcadores por capitulo'
                      : ('reader.actions.bookmarkPosition' | translate)
                  "
                  [disabled]="bookmarks().length >= MAX_BOOKMARKS_PER_CHAPTER"
                  (click)="toggleBookmark()"
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
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span class="btn-label">{{ 'reader.actions.bookmarkPosition' | translate }}</span>
                </button>
                <button
                  type="button"
                  class="icon-btn"
                  [attr.aria-label]="'reader.actions.bookmarks' | translate"
                  [title]="'reader.actions.bookmarks' | translate"
                  (click)="toggleBookmarksPanel()"
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
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <circle cx="3.5" cy="6" r="1" />
                    <circle cx="3.5" cy="12" r="1" />
                    <circle cx="3.5" cy="18" r="1" />
                  </svg>
                  <span class="btn-label">{{ 'reader.actions.bookmarks' | translate }}</span>
                </button>
              }
              <button
                type="button"
                class="icon-btn"
                [attr.aria-label]="'reader.actions.preferences' | translate"
                [title]="'reader.actions.preferences' | translate"
                data-testid="reader-settings"
                (click)="showPreferences.update((value) => !value)"
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
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                  />
                </svg>
                <span class="btn-label">{{ 'reader.actions.preferences' | translate }}</span>
              </button>
            </div>
          </header>

          <!-- TODO: Barra de progreso deshabilitada — ver nota en ngOnInit -->
          <!-- @if (preferences().show_progress) {
          <div class="progress-strip" data-testid="progress-bar">
            <span [style.width.%]="progressPercent() * 100"></span>
          </div>
        } -->
        </div>

        <header class="reader-header">
          <h1>{{ currentChapter.title }}</h1>
          <p>
            por
            <a [routerLink]="['/perfil', currentChapter.novel.author.username]">
              @{{ currentChapter.novel.author.username }}
            </a>
          </p>
        </header>

        @if (showPreferences()) {
          <div class="prefs-overlay" (click)="showPreferences.set(false)"></div>
        }
        @if (showBookmarksPanel()) {
          <div class="bookmarks-overlay" (click)="showBookmarksPanel.set(false)"></div>
        }

        <div class="reader-layout">
          @if (showPreferences() || showBookmarksPanel()) {
            <div class="side-panels">
              @if (showPreferences()) {
                <aside class="panel prefs-panel">
                  <div class="prefs-header">
                    <h3>{{ 'reader.preferences.title' | translate }}</h3>
                    <button
                      type="button"
                      class="prefs-close"
                      aria-label="Cerrar"
                      (click)="showPreferences.set(false)"
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
                  <label>
                    {{ 'reader.preferences.font' | translate }}
                    <select
                      [value]="preferences().font_family"
                      (change)="onPreferenceChange('font_family', $any($event.target).value)"
                    >
                      <option value="crimson">
                        {{ 'reader.preferences.fonts.crimson' | translate }}
                      </option>
                      <option value="outfit">
                        {{ 'reader.preferences.fonts.outfit' | translate }}
                      </option>
                      <option value="georgia">
                        {{ 'reader.preferences.fonts.georgia' | translate }}
                      </option>
                      <option value="mono">
                        {{ 'reader.preferences.fonts.mono' | translate }}
                      </option>
                    </select>
                  </label>
                  <label>
                    {{ 'reader.preferences.fontSize' | translate }}
                    <input
                      type="range"
                      min="14"
                      max="26"
                      [value]="preferences().font_size"
                      (input)="onPreferenceChange('font_size', +$any($event.target).value)"
                      data-testid="font-size-slider"
                    />
                  </label>
                  <label>
                    {{ 'reader.preferences.lineHeight' | translate }}
                    <input
                      type="range"
                      min="1.4"
                      max="2.4"
                      step="0.1"
                      [value]="preferences().line_height"
                      (input)="onPreferenceChange('line_height', +$any($event.target).value)"
                    />
                  </label>
                  <label>
                    {{ 'reader.preferences.mode' | translate }}
                    <select
                      [value]="preferences().reading_mode"
                      (change)="onPreferenceChange('reading_mode', $any($event.target).value)"
                    >
                      <option value="scroll">
                        {{ 'reader.preferences.modeScroll' | translate }}
                      </option>
                      <option value="paginated">
                        {{ 'reader.preferences.modePaginated' | translate }}
                      </option>
                    </select>
                  </label>
                  <label class="toggle">
                    <input
                      type="checkbox"
                      [checked]="preferences().show_progress"
                      (change)="onPreferenceChange('show_progress', $any($event.target).checked)"
                    />
                    {{ 'reader.preferences.showProgress' | translate }}
                  </label>
                </aside>
              }
              @if (showBookmarksPanel()) {
                <aside class="panel bookmarks-panel" #bookmarksPanel>
                  <div class="prefs-header">
                    <h3>{{ 'reader.bookmarksPanel.title' | translate }}</h3>
                    <button
                      type="button"
                      class="prefs-close"
                      aria-label="Cerrar"
                      (click)="showBookmarksPanel.set(false)"
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
                          (click)="scrollToBookmark(bookmark.anchor_id)"
                        >
                          {{ bookmark.label || bookmark.anchor_id || bookmark.chapter.title }}
                        </button>
                        <button type="button" (click)="removeBookmark(bookmark.id)">
                          {{ 'reader.bookmarksPanel.remove' | translate }}
                        </button>
                      </div>
                    }
                  }
                </aside>
              }
            </div>
          }

          <section class="reader-main">
            @if (preferences().reading_mode === 'paginated') {
              <section class="reader-paginated" #readerContainer>
                <div
                  class="reader-body"
                  data-testid="chapter-content"
                  [innerHTML]="pages()[currentPage()]"
                ></div>
                <div class="reader-nav">
                  <button type="button" data-testid="prev-chapter" (click)="goToPreviousPage()">
                    Anterior
                  </button>
                  <span>Pagina {{ currentPage() + 1 }} de {{ pages().length }}</span>
                  <button type="button" data-testid="next-chapter" (click)="goToNextPage()">
                    Siguiente
                  </button>
                </div>
              </section>
            } @else {
              <section
                class="reader-body"
                #readerContainer
                data-testid="chapter-content"
                [innerHTML]="renderedHtml()"
                (mouseup)="handleSelection()"
                (contextmenu)="handleContextMenu($event)"
                (click)="handleReaderClick($event)"
              ></section>
            }

            @if (selectionAnchorId() && isAuthenticated()) {
              <div class="selection-toolbar">
                @for (color of colors; track color) {
                  <button
                    type="button"
                    [style.background]="colorMap[color]"
                    (click)="createHighlight(color)"
                  >
                    {{ color }}
                  </button>
                }
                <button type="button" class="toolbar-comment-btn" (click)="openParagraphComment()">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
            }

            @if (activeParagraphAnchor(); as anchor) {
              <app-paragraph-comments
                [novelSlug]="chapter()!.novel.slug"
                [chapterSlug]="chapter()!.slug"
                [anchorId]="anchor"
                [isAuthenticated]="isAuthenticated()"
                [currentUserId]="currentUser()?.id ?? null"
                [currentUserUsername]="currentUser()?.username ?? null"
                [novelAuthorUsername]="chapter()!.novel.author.username"
                [commentsEnabled]="commentsEnabled()"
                [quotedText]="pendingQuotedText()"
                [startOffset]="pendingStartOffset()"
                [endOffset]="pendingEndOffset()"
                [initialComments]="commentsForAnchor(anchor)"
                (closed)="activeParagraphAnchor.set(null)"
                (commentAdded)="onParagraphCommentAdded()"
                (commentRemoved)="onParagraphCommentRemoved()"
              />
            }
          </section>
        </div>

        <div class="chapter-vote-section">
          @if (isAuthenticated()) {
            <button
              type="button"
              class="vote-action"
              [class.vote-active]="chapterHasVoted()"
              (click)="toggleChapterVote()"
            >
              <svg
                class="vote-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                [attr.fill]="chapterHasVoted() ? 'currentColor' : 'none'"
                aria-hidden="true"
              >
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                />
              </svg>
              {{ chapterHasVoted() ? ('votes.voted' | translate) : ('votes.vote' | translate) }}
            </button>
          } @else {
            <a class="vote-login" routerLink="/login">{{ 'reader.vote.loginCta' | translate }}</a>
          }
          <span class="vote-label">{{
            chapterVotesCount() === 1 ? '1 voto' : chapterVotesCount() + ' votos'
          }}</span>
        </div>

        <footer class="reader-nav">
          @if (currentChapter.navigation?.previous; as previous) {
            <a
              [routerLink]="['/novelas', currentChapter.novel.slug, previous.slug]"
              data-testid="prev-chapter"
              >← {{ previous.title }}</a
            >
          }
          @if (currentChapter.navigation?.next; as next) {
            <a
              [routerLink]="['/novelas', currentChapter.novel.slug, next.slug]"
              data-testid="next-chapter"
              >{{ next.title }} →</a
            >
          }
        </footer>

        <section class="chapter-comments card" data-testid="chapter-comments">
          <h2>{{ 'reader.comments.title' | translate }}</h2>

          @if (commentsEnabled()) {
            @if (isAuthenticated()) {
              <div class="comment-form">
                <textarea
                  [(ngModel)]="newComment"
                  rows="3"
                  [placeholder]="'reader.comments.placeholder' | translate"
                  maxlength="2000"
                ></textarea>
                <button
                  type="button"
                  class="btn-send"
                  [disabled]="!newComment.trim() || commentSending()"
                  (click)="submitComment(currentChapter)"
                >
                  {{
                    commentSending()
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
                        @if (deletableCommentIds().has(c.id)) {
                          <button
                            type="button"
                            class="comment-delete"
                            (click)="removeComment(currentChapter, c.id)"
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

              @if (commentsHasMore()) {
                <button
                  type="button"
                  class="btn-load-more"
                  (click)="loadMoreComments(currentChapter)"
                >
                  {{ 'reader.comments.loadMore' | translate }}
                </button>
              }
            }
          } @else {
            <p class="comment-hint">{{ 'reader.comments.disabled' | translate }}</p>
          }
        </section>
      </article>
    }
  `,
  styles: [
    `
      .reader-shell {
        display: grid;
        gap: 1rem;
      }
      .reader-topbar,
      .reader-topbar__actions,
      .reader-layout,
      .reader-nav,
      .panel-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      /* Breadcrumb "Novelas / Titulo" en una sola linea, sin subrayado.
         El separador se inyecta con ::after para evitar problemas de baseline
         (un <span> con "/" se renderiza visualmente desalineado). */
      .reader-topbar__left {
        display: flex;
        flex-wrap: nowrap;
        align-items: baseline;
        gap: 0;
        min-width: 0;
        font-size: 0.95rem;
        line-height: 1.4;
      }
      .reader-topbar__left a {
        text-decoration: none;
        white-space: nowrap;
        color: var(--accent-text);
      }
      .reader-topbar__left a:hover {
        color: var(--accent);
      }
      .reader-topbar__left a:not(:last-child)::after {
        content: '/';
        display: inline-block;
        margin: 0 0.45rem;
        color: var(--text-2);
        font-weight: 400;
      }
      .reader-topbar__left a:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }
      /* Topbar + barra de progreso pegadas arriba juntas. */
      .reader-sticky {
        position: sticky;
        top: 0;
        z-index: 5;
        background: color-mix(in srgb, var(--bg-app) 88%, transparent);
        backdrop-filter: blur(8px);
        padding: 0.75rem 0 0.5rem;
        display: grid;
        gap: 0.5rem;
      }
      .reader-topbar {
        padding: 0;
      }
      .progress-strip {
        height: 3px;
        background: var(--bg-surface);
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-strip span {
        display: block;
        height: 100%;
        background: var(--accent);
        transition: width 180ms ease;
      }
      .reader-layout {
        align-items: start;
      }
      .reader-main {
        flex: 1;
        display: grid;
        gap: 1rem;
      }
      .reader-header a {
        color: var(--text-2);
        text-decoration: none;
      }
      .reader-header a:hover {
        color: var(--accent-text);
      }
      .reader-body,
      .panel,
      .reader-paginated {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1.5rem;
      }
      .reader-body,
      .reader-paginated {
        padding: 2rem;
        margin: 0 auto;
        width: 100%;
        overflow-wrap: anywhere;
      }
      .panel {
        width: min(300px, 100%);
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
      }
      .side-panels {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: min(300px, 100%);
        align-self: start;
        position: sticky;
        top: 5rem;
      }
      .side-panels .panel {
        width: 100%;
      }
      .bookmarks-panel {
        scroll-margin-top: 5rem;
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
      :host ::ng-deep .bookmark-flash {
        background: color-mix(in srgb, var(--accent) 25%, transparent) !important;
        border-radius: 0.25rem;
        transition: background 400ms ease;
      }
      :host ::ng-deep .bookmark-marker {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.15rem 0.5rem;
        margin-left: 0.5rem;
        float: right;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.75rem;
        line-height: 1.4;
        vertical-align: middle;
        cursor: default;
        white-space: nowrap;
      }
      :host ::ng-deep .bookmark-marker svg {
        flex-shrink: 0;
      }
      :host ::ng-deep .bookmark-marker-label:empty {
        display: none;
      }
      :host ::ng-deep .bookmark-marker-delete {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        min-height: 16px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--accent-text);
        font-size: 0.65rem;
        cursor: pointer;
        line-height: 1;
      }
      :host ::ng-deep .bookmark-marker-delete:hover {
        background: color-mix(in srgb, #8b2e2e 30%, var(--bg-surface));
        color: #ffb3b3;
      }
      .reader-body {
        max-width: var(--reader-max-width, 720px);
        font-size: var(--reader-font-size, 18px);
        line-height: var(--reader-line-height, 1.8);
        font-family: var(--reader-font-family, 'Crimson Pro', Georgia, serif);
      }
      .reader-paginated .reader-body {
        padding: 0;
        border: 0;
        background: transparent;
      }
      .selection-toolbar {
        position: sticky;
        bottom: 1rem;
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 999px;
        background: var(--bg-surface);
        width: fit-content;
      }
      .toolbar-comment-btn {
        background: var(--accent);
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        min-height: unset;
        cursor: pointer;
        font-size: 0.9rem;
        display: grid;
        place-items: center;
        padding: 0;
      }
      .toolbar-comment-btn:hover {
        opacity: 0.85;
      }
      :host ::ng-deep .comment-indicator:hover {
        background: var(--accent) !important;
        color: #fff !important;
      }
      .hint-banner {
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .icon-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font-size: 0.85rem;
      }
      .icon-btn:hover {
        border-color: var(--accent-text);
        color: var(--accent-text);
      }
      .icon-btn svg {
        flex-shrink: 0;
      }
      button,
      select,
      input {
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.5rem 0.8rem;
      }
      /* Quita el azul de controles nativos (range, checkbox, select focus). */
      select,
      input[type='range'],
      input[type='checkbox'] {
        accent-color: var(--accent-text);
      }
      select:focus,
      input:focus {
        outline: 2px solid var(--accent-text);
        outline-offset: 2px;
      }
      input[type='range'] {
        padding: 0;
        border: 0;
        background: transparent;
      }
      input[type='range']::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 2px;
        background: var(--border);
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-text);
        margin-top: -6px;
        cursor: pointer;
      }
      input[type='range']::-moz-range-track {
        height: 4px;
        border-radius: 2px;
        background: var(--border);
        border: 0;
      }
      input[type='range']::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-text);
        border: 0;
        cursor: pointer;
      }
      label {
        display: grid;
        gap: 0.35rem;
      }
      .toggle {
        display: flex;
        align-items: center;
      }
      a {
        color: var(--accent-text);
      }
      .chapter-vote-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1.5rem 0;
        border-top: 1px solid var(--border);
      }
      .vote-action {
        cursor: pointer;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .vote-action .vote-icon {
        flex-shrink: 0;
      }
      .vote-active,
      .vote-active:hover {
        background: var(--accent-glow) !important;
        color: var(--accent-text) !important;
        border-color: var(--accent-text) !important;
      }
      .vote-login {
        padding: 0.5rem 0.9rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.85rem;
        text-decoration: none;
      }
      .vote-login:hover {
        color: var(--accent);
      }

      /* === Chapter comments === */
      .chapter-comments.card {
        padding: 1.25rem;
        display: grid;
        gap: 1rem;
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
      .chapter-comments.card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1.25rem;
      }
      .vote-label {
        color: var(--text-2);
        font-size: 0.85rem;
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
      /* Overlays ocultos en desktop, visibles en mobile. */
      .prefs-overlay,
      .bookmarks-overlay {
        display: none;
      }
      @media (max-width: 960px) {
        .reader-layout {
          display: grid;
        }
        .panel {
          width: 100%;
        }
        .side-panels {
          position: static;
          width: 100%;
          display: contents;
        }
        /* Preferencias y marcadores como dialogs flotantes en mobile. */
        .prefs-overlay,
        .bookmarks-overlay {
          display: block;
          position: fixed;
          inset: 0;
          z-index: 90;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(3px);
        }
        .prefs-panel,
        .bookmarks-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 91;
          width: min(360px, calc(100vw - 2rem));
          max-height: 85vh;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 1.25rem;
          background: var(--bg-card);
          box-shadow: 0 16px 48px -12px var(--shadow);
        }
      }
      /* Mobile: oculta el texto de los botones de la topbar y deja solo el icono.
         Forzamos width = height = min-height (44px global) para circulo perfecto. */
      @media (max-width: 640px) {
        .icon-btn .btn-label {
          display: none;
        }
        .icon-btn {
          padding: 0;
          width: 44px;
          height: 44px;
          min-height: 44px;
          flex: 0 0 44px;
          justify-content: center;
          aspect-ratio: 1 / 1;
        }
      }
    `,
  ],
})
export class ChapterReaderPageComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly chaptersService = inject(ChaptersService);
  private readonly markdownService = inject(MarkdownService);
  private readonly authService = inject(AuthService);
  private readonly readerService = inject(ReaderService);
  private readonly bookmarksService = inject(BookmarksService);
  private readonly highlightsService = inject(HighlightsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly votesService = inject(VotesService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly ngZone = inject(NgZone);

  @ViewChild('readerContainer') readerContainer?: ElementRef<HTMLElement>;
  @ViewChild('bookmarksPanel') bookmarksPanel?: ElementRef<HTMLElement>;

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly chapter = signal<ChapterDetail | null>(null);
  readonly renderedHtml = signal<SafeHtml>('');
  private renderedHtmlRaw = '';
  readonly pages = signal<SafeHtml[]>([]);
  readonly currentPage = signal(0);
  readonly showPreferences = signal(false);
  readonly showBookmarksPanel = signal(false);
  readonly bookmarks = signal<ReaderBookmark[]>([]);
  readonly highlights = signal<Highlight[]>([]);
  readonly selectionAnchorId = signal<string | null>(null);
  readonly selectionStart = signal(0);
  readonly selectionEnd = signal(0);
  readonly progressPercent = signal(0);
  readonly preferences = signal<ReaderPreferences>({
    id: 'local',
    font_family: 'crimson',
    font_size: 18,
    line_height: 1.8,
    max_width: 720,
    reading_mode: 'scroll',
    show_progress: true,
    created_at: '',
    updated_at: '',
  });

  readonly chapterVotesCount = signal(0);
  readonly chapterHasVoted = signal(false);

  // Comments state
  readonly comments = signal<ChapterCommentModel[]>([]);
  readonly commentsCursor = signal<string | null>(null);
  readonly commentsHasMore = signal(false);
  readonly commentsEnabled = signal(true);
  readonly commentsLoading = signal(false);
  readonly commentSending = signal(false);
  newComment = '';

  // Paragraph comments state
  readonly paragraphCommentCounts = signal<Map<string, number>>(new Map());
  readonly activeParagraphAnchor = signal<string | null>(null);
  readonly pendingQuotedText = signal<string | null>(null);
  readonly pendingStartOffset = signal(0);
  readonly pendingEndOffset = signal(0);

  /** Pre-computed set of comment IDs the current user can delete.
   *  Avoids calling a method per comment in the @for loop on every CD cycle. */
  readonly deletableCommentIds = computed(() => {
    const me = this.authService.getCurrentUserSnapshot();
    const chapter = this.chapter();
    if (!me || !chapter) return new Set<string>();
    const isNovelAuthor = chapter.novel.author.username === me.username;
    return new Set(
      this.comments()
        .filter((c) => c.author.id === me.id || isNovelAuthor)
        .map((c) => c.id),
    );
  });

  readonly colors: HighlightColor[] = ['yellow', 'green', 'blue', 'pink'];
  readonly colorMap: Record<HighlightColor, string> = {
    yellow: '#f5d94a',
    green: '#76d39b',
    blue: '#76b4ff',
    pink: '#ff8ec7',
  };

  private readonly progressQueue = new Subject<number>();
  private readonly preferencesQueue = new Subject<Partial<ReaderPreferences>>();
  private slug = '';
  private chapterSlug = '';

  ngOnInit() {
    // TODO: Progreso de lectura deshabilitado temporalmente — genera demasiadas
    // llamadas a POST /reader/progress. Rehabilitar cuando se optimice el endpoint
    // (debounce 10-15s + eliminar queries de validación redundantes en el backend).
    // this.progressQueue
    //   .pipe(
    //     throttleTime(5000, undefined, { leading: false, trailing: true }),
    //     takeUntilDestroyed(this.destroyRef),
    //   )
    //   .subscribe((scrollPct) => this.persistProgress(scrollPct));

    this.preferencesQueue
      .pipe(
        throttleTime(800, undefined, { leading: false, trailing: true }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((payload) => this.persistPreferences(payload));

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      const chapterSlug = params.get('chSlug');

      if (!slug || !chapterSlug) {
        return;
      }

      this.slug = slug;
      this.chapterSlug = chapterSlug;
      this.loadChapter();
    });
  }

  ngAfterViewInit() {
    this.applyReaderStyles();
    this.setupScrollTracking();
  }

  isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  currentUser() {
    return this.authService.getCurrentUserSnapshot();
  }

  toggleChapterVote() {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    const chapter = this.chapter();
    if (!chapter) return;

    const wasVoted = this.chapterHasVoted();
    const prevCount = this.chapterVotesCount();

    // Optimistic update
    this.chapterHasVoted.set(!wasVoted);
    this.chapterVotesCount.set(prevCount + (wasVoted ? -1 : 1));

    const action = wasVoted
      ? this.votesService.removeVote(chapter.id)
      : this.votesService.castVote(chapter.id);

    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.chapterVotesCount.set(response.votesCount);
        this.chapterHasVoted.set(response.hasVoted);
      },
      error: () => {
        this.chapterHasVoted.set(wasVoted);
        this.chapterVotesCount.set(prevCount);
      },
    });
  }

  /** Scroll tracking runs outside Angular zone to avoid triggering CD on every frame. */
  private setupScrollTracking() {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'scroll', { passive: true })
        .pipe(auditTime(16), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.preferences().reading_mode !== 'scroll' || !this.readerContainer) return;
          const container = this.readerContainer.nativeElement;
          const rect = container.getBoundingClientRect();
          const maxDistance = container.offsetHeight - window.innerHeight;
          const traveled = Math.min(Math.max(-rect.top, 0), Math.max(maxDistance, 1));
          const pct = maxDistance > 0 ? traveled / maxDistance : 1;
          this.progressPercent.set(pct);
        });
    });
  }

  @HostListener('window:keydown.arrowright')
  onArrowRight() {
    if (this.preferences().reading_mode === 'paginated') {
      this.goToNextPage();
    }
  }

  @HostListener('window:keydown.arrowleft')
  onArrowLeft() {
    if (this.preferences().reading_mode === 'paginated') {
      this.goToPreviousPage();
    }
  }

  toggleBookmarksPanel() {
    const opening = !this.showBookmarksPanel();
    this.showBookmarksPanel.set(opening);
    if (opening) {
      setTimeout(() => {
        this.bookmarksPanel?.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 50);
    }
  }

  readonly MAX_BOOKMARKS_PER_CHAPTER = 10;

  toggleBookmark() {
    const chapter = this.chapter();
    if (!chapter || !this.isAuthenticated()) {
      return;
    }

    if (this.bookmarks().length >= this.MAX_BOOKMARKS_PER_CHAPTER) {
      this.showBookmarksPanel.set(true);
      return;
    }

    const anchorId = this.currentAnchorId();

    this.dialog
      .open(PromptDialogComponent, {
        width: '360px',
        data: {
          title: this.t.translate('reader.bookmarks.add'),
          label: this.t.translate('reader.bookmarks.label'),
          placeholder: this.t.translate('reader.bookmarks.labelPlaceholder'),
        } as PromptDialogData,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((label: string | null) => {
        if (label === null) return;
        this.bookmarksService
          .create({
            novel_id: chapter.novel.id,
            chapter_id: chapter.id,
            anchor_id: anchorId,
            label: label || undefined,
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.loadChapterBookmarks(chapter.id);
            this.showBookmarksPanel.set(true);
            if (anchorId) {
              this.highlightAnchor(anchorId);
            }
          });
      });
  }

  handleReaderClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    const deleteBtn = target?.closest('.bookmark-marker-delete') as HTMLElement | null;
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();
      const bookmarkId = deleteBtn.getAttribute('data-bookmark-id');
      if (bookmarkId) {
        this.removeBookmark(bookmarkId);
      }
      return;
    }

    const commentIndicator = target?.closest('.comment-indicator') as HTMLElement | null;
    if (commentIndicator) {
      event.preventDefault();
      event.stopPropagation();
      const anchorId = commentIndicator.getAttribute('data-anchor-id');
      if (anchorId) {
        this.toggleParagraphComments(anchorId);
      }
    }
  }

  scrollToBookmark(anchorId: string | null) {
    if (!anchorId) return;
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightAnchor(anchorId);
    }
  }

  private highlightAnchor(anchorId: string) {
    const el = document.getElementById(anchorId);
    if (!el) return;
    el.classList.add('bookmark-flash');
    setTimeout(() => el.classList.remove('bookmark-flash'), 1500);
  }

  removeBookmark(id: string) {
    this.bookmarksService
      .remove(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const chapter = this.chapter();
        if (chapter) {
          this.loadChapterBookmarks(chapter.id);
        }
      });
  }

  handleContextMenu(event: MouseEvent) {
    if (!this.isAuthenticated()) {
      return;
    }

    const paragraph = (event.target as HTMLElement | null)?.closest('[data-anchor-id]');
    if (!paragraph) {
      return;
    }

    event.preventDefault();
    const chapter = this.chapter();
    if (!chapter) {
      return;
    }

    this.dialog
      .open(PromptDialogComponent, {
        width: '360px',
        data: {
          title: 'Nuevo marcador',
          label: 'Etiqueta del marcador',
          placeholder: 'Ej: escena importante',
        } as PromptDialogData,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((label: string | null) => {
        if (label === null) return;
        this.bookmarksService
          .create({
            novel_id: chapter.novel.id,
            chapter_id: chapter.id,
            anchor_id: paragraph.getAttribute('data-anchor-id'),
            label,
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.loadChapterBookmarks(chapter.id));
      });
  }

  handleSelection() {
    if (!this.isAuthenticated()) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      this.selectionAnchorId.set(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const paragraph = (
      range.startContainer.parentElement ?? (range.startContainer.parentNode as HTMLElement | null)
    )?.closest('[data-anchor-id]');

    if (!paragraph) {
      this.selectionAnchorId.set(null);
      return;
    }

    const fullText = paragraph.textContent ?? '';
    const selectedText = selection.toString();
    const startOffset = fullText.indexOf(selectedText);
    if (startOffset < 0) {
      this.selectionAnchorId.set(null);
      return;
    }

    this.selectionAnchorId.set(paragraph.getAttribute('data-anchor-id'));
    this.selectionStart.set(startOffset);
    this.selectionEnd.set(startOffset + selectedText.length);
  }

  createHighlight(color: HighlightColor) {
    const chapter = this.chapter();
    const anchorId = this.selectionAnchorId();
    if (!chapter || !anchorId) {
      return;
    }

    this.highlightsService
      .create({
        novel_id: chapter.novel.id,
        chapter_id: chapter.id,
        anchor_id: anchorId,
        start_offset: this.selectionStart(),
        end_offset: this.selectionEnd(),
        color,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.selectionAnchorId.set(null);
        this.loadChapterHighlights(chapter.id);
      });
  }

  goToNextPage() {
    const pages = this.pages();
    if (!pages.length) {
      return;
    }

    if (this.currentPage() < pages.length - 1) {
      this.currentPage.update((value) => value + 1);
      this.updatePaginatedProgress();
      return;
    }

    const next = this.chapter()?.navigation?.next;
    if (next) {
      window.location.href = `/novelas/${this.slug}/${next.slug}`;
    }
  }

  goToPreviousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update((value) => value - 1);
      this.updatePaginatedProgress();
      return;
    }

    const previous = this.chapter()?.navigation?.previous;
    if (previous) {
      window.location.href = `/novelas/${this.slug}/${previous.slug}`;
    }
  }

  onPreferenceChange(key: keyof ReaderPreferences, value: string | number | boolean) {
    const next = {
      ...this.preferences(),
      [key]: value,
    } as ReaderPreferences;

    this.preferences.set(next);
    this.applyReaderStyles();
    this.preferencesQueue.next({ [key]: value } as Partial<ReaderPreferences>);

    if (key === 'reading_mode') {
      this.buildPages();
    }
  }

  private loadChapter() {
    this.loading.set(true);
    this.selectionAnchorId.set(null);

    const onLoaded = (chapter: ChapterDetail) => {
      this.chapter.set(chapter);
      this.chapterVotesCount.set(chapter.votesCount ?? 0);
      this.loadPreferences();
      this.refreshRenderedContent();
      this.buildPages();
      this.loading.set(false);
      this.loadComments(chapter, true);
      if (this.isAuthenticated()) {
        this.readerService
          .addHistory({ novel_id: chapter.novel.id, chapter_id: chapter.id })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
        this.loadChapterBookmarks(chapter.id);
        this.loadChapterHighlights(chapter.id);
        // TODO: Progreso de lectura deshabilitado — ver nota en ngOnInit
        // this.restoreProgress(chapter.novel.id);
        this.loadVoteStatus(chapter.id);
      }
    };
    this.chaptersService
      .getReaderChapter(this.slug, this.chapterSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: onLoaded,
        error: () => {
          // Fallback: si es draft del autor, usar el endpoint del editor.
          if (this.isAuthenticated()) {
            this.chaptersService
              .getEditorChapter(this.slug, this.chapterSlug)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: onLoaded,
                error: () => {
                  this.error.set(true);
                  this.loading.set(false);
                },
              });
          } else {
            this.error.set(true);
            this.loading.set(false);
          }
        },
      });
  }

  private loadPreferences() {
    const localPreferences = localStorage.getItem('plotcraft_reader_preferences');
    if (localPreferences) {
      this.preferences.set(JSON.parse(localPreferences) as ReaderPreferences);
      this.applyReaderStyles();
    }

    if (!this.isAuthenticated()) {
      return;
    }

    this.readerService
      .getPreferences()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((preferences) => {
        this.preferences.set(preferences);
        localStorage.setItem('plotcraft_reader_preferences', JSON.stringify(preferences));
        this.applyReaderStyles();
        this.buildPages();
      });
  }

  private persistPreferences(payload: Partial<ReaderPreferences>) {
    localStorage.setItem(
      'plotcraft_reader_preferences',
      JSON.stringify({ ...this.preferences(), ...payload }),
    );

    if (this.isAuthenticated()) {
      this.readerService
        .updatePreferences(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  private loadChapterBookmarks(chapterId: string) {
    this.bookmarksService
      .listByChapter(chapterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bookmarks) => {
        this.bookmarks.set(bookmarks);
        this.refreshRenderedContent();
        this.buildPages();
      });
  }

  private loadChapterHighlights(chapterId: string) {
    this.highlightsService
      .listByChapter(chapterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((highlights) => {
        this.highlights.set(highlights);
        this.refreshRenderedContent();
        this.buildPages();
      });
  }

  private refreshRenderedContent() {
    const chapter = this.chapter();
    if (!chapter) {
      return;
    }

    let html = this.applyHighlightsToHtml(
      this.assignAnchorIds(this.markdownService.render(chapter.content)),
      this.highlights(),
    );
    html = this.applyBookmarkMarkers(html, this.bookmarks());
    html = this.applyCommentIndicators(html, this.paragraphCommentCounts());

    // Bypass Angular's innerHTML sanitizer (DOMPurify already sanitized the content)
    // so that id and data-anchor-id attributes survive for bookmarks/highlights.
    this.renderedHtmlRaw = html;
    this.renderedHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
  }

  private assignAnchorIds(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const targets = [...doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote')];

    targets.forEach((element, index) => {
      const anchor = `p-${index + 1}`;
      element.id = anchor;
      element.setAttribute('data-anchor-id', anchor);
    });

    return doc.body.innerHTML;
  }

  private applyHighlightsToHtml(html: string, highlights: Highlight[]) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const grouped = new Map<string, Highlight[]>();

    highlights.forEach((highlight) => {
      const list = grouped.get(highlight.anchor_id) ?? [];
      list.push(highlight);
      grouped.set(highlight.anchor_id, list);
    });

    grouped.forEach((items, anchorId) => {
      const element = doc.body.querySelector<HTMLElement>(`#${anchorId}`);
      if (!element) {
        return;
      }

      let text = element.textContent ?? '';
      items
        .sort((a, b) => b.start_offset - a.start_offset)
        .forEach((highlight) => {
          const before = text.slice(0, highlight.start_offset);
          const marked = text.slice(highlight.start_offset, highlight.end_offset);
          const after = text.slice(highlight.end_offset);
          text =
            `${this.escapeHtml(before)}<span class="reader-highlight reader-highlight--${highlight.color}" data-highlight-id="${highlight.id}">` +
            `${this.escapeHtml(marked)}</span>${this.escapeHtml(after)}`;
        });

      element.innerHTML = text;
    });

    return doc.body.innerHTML;
  }

  private applyBookmarkMarkers(html: string, bookmarks: ReaderBookmark[]): string {
    if (!bookmarks.length) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const grouped = new Map<string, ReaderBookmark[]>();

    for (const bk of bookmarks) {
      if (!bk.anchor_id) continue;
      const list = grouped.get(bk.anchor_id) ?? [];
      list.push(bk);
      grouped.set(bk.anchor_id, list);
    }

    grouped.forEach((items, anchorId) => {
      const element = doc.body.querySelector(`#${anchorId}`);
      if (!element) return;
      const markers = items
        .map(
          (bk) =>
            `<span class="bookmark-marker" data-bookmark-id="${bk.id}">` +
            `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" aria-hidden="true">` +
            `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>` +
            `</svg>` +
            `<span class="bookmark-marker-label">${this.escapeHtml(bk.label || '')}</span>` +
            `<button type="button" class="bookmark-marker-delete" data-bookmark-id="${bk.id}" title="Eliminar marcador">✕</button>` +
            `</span>`,
        )
        .join('');
      element.insertAdjacentHTML('beforeend', markers);
    });

    return doc.body.innerHTML;
  }

  private applyCommentIndicators(html: string, counts: Map<string, number>): string {
    if (!counts.size) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    counts.forEach((count, anchorId) => {
      const element = doc.body.querySelector(`#${anchorId}`);
      if (!element) return;
      element.insertAdjacentHTML(
        'beforeend',
        `<span class="comment-indicator" data-anchor-id="${anchorId}" title="${count} comentario${count > 1 ? 's' : ''}" style="display:inline-flex;align-items:center;gap:3px;color:var(--accent-text);background:var(--accent-glow);padding:3px 8px;border-radius:999px;cursor:pointer;user-select:none;float:right;margin-left:8px;line-height:1;font-size:0.72rem;font-weight:600"><svg style="flex-shrink:0" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${count}</span>`,
      );
    });

    return doc.body.innerHTML;
  }

  private buildPages() {
    if (this.preferences().reading_mode !== 'paginated') {
      this.pages.set([]);
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.renderedHtmlRaw, 'text/html');
    const nodes = [...doc.body.children].map((node) => node.outerHTML);
    const pageSize = Math.max(2, Math.floor((window.innerHeight - 240) / 120));
    const safePages: SafeHtml[] = [];

    for (let index = 0; index < nodes.length; index += pageSize) {
      safePages.push(
        this.sanitizer.bypassSecurityTrustHtml(nodes.slice(index, index + pageSize).join('')),
      );
    }

    this.pages.set(safePages.length ? safePages : [this.sanitizer.bypassSecurityTrustHtml('')]);
  }

  private restoreProgress(novelId: string) {
    this.readerService.getProgress(novelId).subscribe((progress) => {
      if (!progress) {
        return;
      }

      this.progressPercent.set(progress.scroll_pct);
      if (this.preferences().reading_mode === 'paginated') {
        this.currentPage.set(
          Math.max(
            0,
            Math.min(
              this.pages().length - 1,
              Math.round(progress.scroll_pct * Math.max(this.pages().length - 1, 1)),
            ),
          ),
        );
        return;
      }

      requestAnimationFrame(() => {
        const container = this.readerContainer?.nativeElement;
        if (!container) {
          return;
        }

        const anchor = this.currentAnchorId();
        if (anchor) {
          document.getElementById(anchor)?.scrollIntoView({ block: 'center' });
          return;
        }

        window.scrollTo({
          top: container.offsetTop + container.offsetHeight * progress.scroll_pct,
        });
      });
    });
  }

  // TODO: Progreso de lectura deshabilitado — ver nota en ngOnInit
  // private persistProgress(scrollPct: number) {
  //   const chapter = this.chapter();
  //   if (!chapter || !this.isAuthenticated()) {
  //     return;
  //   }
  //   this.readerService
  //     .saveProgress({
  //       novel_id: chapter.novel.id,
  //       chapter_id: chapter.id,
  //       scroll_pct: scrollPct,
  //     })
  //     .subscribe();
  // }

  private updatePaginatedProgress() {
    const pct = this.pages().length > 1 ? this.currentPage() / (this.pages().length - 1) : 1;
    this.progressPercent.set(pct);
    // TODO: Progreso de lectura deshabilitado — ver nota en ngOnInit
    // this.progressQueue.next(pct);
  }

  private currentAnchorId() {
    const anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-anchor-id]'));
    if (!anchors.length) {
      return null;
    }

    const candidate =
      anchors.find((anchor) => anchor.getBoundingClientRect().top >= 0) ?? anchors[0];
    return candidate.getAttribute('data-anchor-id');
  }

  private applyReaderStyles() {
    const container = this.readerContainer?.nativeElement;
    if (!container) {
      return;
    }

    const fontMap: Record<string, string> = {
      crimson: "'Crimson Pro', Georgia, serif",
      outfit: "'Outfit', sans-serif",
      georgia: 'Georgia, serif',
      mono: "'Courier New', monospace",
    };

    container.style.setProperty('--reader-font-size', `${this.preferences().font_size}px`);
    container.style.setProperty('--reader-line-height', `${this.preferences().line_height}`);
    container.style.setProperty('--reader-max-width', `${this.preferences().max_width}px`);
    container.style.setProperty(
      '--reader-font-family',
      fontMap[this.preferences().font_family] ?? fontMap['crimson'],
    );
  }

  // ── Comments ──

  loadComments(chapter: ChapterDetail, reset: boolean) {
    if (reset) {
      this.comments.set([]);
      this.commentsCursor.set(null);
      this.commentsHasMore.set(false);
    }
    this.commentsLoading.set(true);
    this.chaptersService
      .listChapterComments(
        chapter.novel.slug,
        chapter.slug,
        reset ? null : this.commentsCursor(),
        20,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const allComments = reset ? res.data : [...this.comments(), ...res.data];
          this.comments.set(allComments);
          this.commentsCursor.set(res.pagination.nextCursor);
          this.commentsHasMore.set(res.pagination.hasMore);
          this.commentsEnabled.set(res.commentsEnabled);
          this.commentsLoading.set(false);

          // Compute paragraph comment counts
          const counts = new Map<string, number>();
          for (const c of allComments) {
            if (c.anchorId) {
              counts.set(c.anchorId, (counts.get(c.anchorId) ?? 0) + 1);
            }
          }
          this.paragraphCommentCounts.set(counts);
          this.refreshRenderedContent();
        },
        error: () => this.commentsLoading.set(false),
      });
  }

  loadMoreComments(chapter: ChapterDetail) {
    this.loadComments(chapter, false);
  }

  submitComment(chapter: ChapterDetail) {
    const text = this.newComment.trim();
    if (!text || this.commentSending() || !this.isAuthenticated()) return;
    this.commentSending.set(true);
    this.chaptersService
      .createChapterComment(chapter.novel.slug, chapter.slug, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.comments.update((prev) => [...prev, created]);
          this.newComment = '';
          this.commentSending.set(false);
        },
        error: () => this.commentSending.set(false),
      });
  }

  removeComment(chapter: ChapterDetail, commentId: string) {
    this.chaptersService
      .deleteChapterComment(chapter.novel.slug, chapter.slug, commentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.comments.update((prev) => prev.filter((c) => c.id !== commentId)),
      });
  }

  // canDeleteComment migrado a computed signal (deletableCommentIds)
  // para evitar re-ejecución en cada ciclo de CD dentro del @for.

  // ── Paragraph Comments ──

  commentsForAnchor(anchorId: string): ChapterCommentModel[] {
    return this.comments().filter((c) => c.anchorId === anchorId);
  }

  openParagraphComment() {
    const anchor = this.selectionAnchorId();
    if (!anchor) return;

    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';

    this.pendingQuotedText.set(text || null);
    this.pendingStartOffset.set(this.selectionStart());
    this.pendingEndOffset.set(this.selectionEnd());
    this.activeParagraphAnchor.set(anchor);

    // Clear selection toolbar
    this.selectionAnchorId.set(null);
    sel?.removeAllRanges();
  }

  toggleParagraphComments(anchorId: string) {
    if (this.activeParagraphAnchor() === anchorId) {
      this.activeParagraphAnchor.set(null);
    } else {
      this.pendingQuotedText.set(null);
      this.pendingStartOffset.set(0);
      this.pendingEndOffset.set(0);
      this.activeParagraphAnchor.set(anchorId);
    }
  }

  onParagraphCommentAdded() {
    const anchor = this.activeParagraphAnchor();
    if (!anchor) return;
    this.paragraphCommentCounts.update((m) => {
      const next = new Map(m);
      next.set(anchor, (next.get(anchor) ?? 0) + 1);
      return next;
    });
    this.refreshRenderedContent();
  }

  onParagraphCommentRemoved() {
    const anchor = this.activeParagraphAnchor();
    if (!anchor) return;
    this.paragraphCommentCounts.update((m) => {
      const next = new Map(m);
      const count = (next.get(anchor) ?? 1) - 1;
      if (count <= 0) next.delete(anchor);
      else next.set(anchor, count);
      return next;
    });
    this.refreshRenderedContent();
  }

  // relativeDate migrado a RelativeDatePipe (pure) en el template.
  // El pipe existente (shared/pipes/relative-date.pipe.ts) cubre la misma lógica.
  private readonly t = inject(TranslationService);

  private loadVoteStatus(chapterId: string) {
    this.votesService
      .getVoteStatus(chapterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.chapterVotesCount.set(response.votesCount);
          this.chapterHasVoted.set(response.hasVoted);
        },
      });
  }

  private escapeHtml(value: string) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }
}
