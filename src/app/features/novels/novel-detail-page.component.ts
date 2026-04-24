import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NovelDetail } from '../../core/models/novel.model';
import { AuthService } from '../../core/services/auth.service';
import { KudosService } from '../../core/services/kudos.service';
import { NovelsService } from '../../core/services/novels.service';
import { SubscriptionsService } from '../../core/services/subscriptions.service';
import { ReadingList } from '../../core/models/reading-list.model';
import { ReadingListsService } from '../../core/services/reading-lists.service';
import { TimelineService } from '../../core/services/timeline.service';
import { TimelineDetail } from '../../core/models/timeline.model';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CharacterCardComponent } from '../characters/components/character-card.component';
import { WorldCardComponent } from '../worlds/components/world-card.component';
import { LinkedVisualBoardsSectionComponent } from '../visual-boards/components/linked-visual-boards-section.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { PostsService } from '../../core/services/posts.service';
import { NovelDetailHeaderComponent } from './components/novel-detail/novel-detail-header.component';
import { NovelDetailChaptersComponent } from './components/novel-detail/novel-detail-chapters.component';
import { NovelDetailSidebarComponent } from './components/novel-detail/novel-detail-sidebar.component';
import { NovelDetailCommentsComponent } from './components/novel-detail/novel-detail-comments.component';

const EVENT_TYPE_ICONS: Record<string, string> = {
  WORLD_EVENT: '\u{1F30D}',
  STORY_EVENT: '\u{1F4D6}',
  CHARACTER_ARC: '\u{1F3AD}',
  CHAPTER_EVENT: '\u{1F4C4}',
  LORE_EVENT: '\u{1F4DC}',
  NOTE: '\u{1F4DD}',
};

@Component({
  selector: 'app-novel-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    SlicePipe,
    FormsModule,
    ErrorMessageComponent,
    LoadingSpinnerComponent,
    WorldCardComponent,
    CharacterCardComponent,
    LinkedVisualBoardsSectionComponent,
    TranslatePipe,
    NovelDetailHeaderComponent,
    NovelDetailChaptersComponent,
    NovelDetailSidebarComponent,
    NovelDetailCommentsComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-message />
    } @else if (novel(); as currentNovel) {
      <section class="detail-shell">
        <app-novel-detail-header
          [novel]="currentNovel"
          [isAuthenticated]="authService.isAuthenticated()"
          [kudoLoading]="kudoLoading()"
          [kudoBeat]="kudoBeat()"
          [subscribeLoading]="subscribeLoading()"
          [recommended]="recommended()"
          [showListsMenu]="showListsMenu()"
          [listsLoading]="listsLoading()"
          [listsError]="listsError()"
          [listsMessage]="listsMessage()"
          [readingLists]="readingLists()"
          [listMembership]="listMembership()"
          [listActionId]="listActionId()"
          (toggleKudo)="toggleKudo()"
          (toggleBookmark)="toggleBookmark()"
          (toggleSubscribe)="toggleSubscription()"
          (toggleListsMenu)="toggleListsMenu()"
          (toggleListMembershipEvt)="toggleListMembership($event)"
          (openRecommend)="openRecommendPreview()"
        />

        <section class="content-grid">
          <app-novel-detail-chapters
            [chapters]="currentNovel.chapters"
            [novelSlug]="currentNovel.slug"
          />

          <app-novel-detail-sidebar [novel]="currentNovel" />
        </section>

        @if (currentNovel.worlds.length && currentNovel.novelType !== 'FANFIC') {
          <section class="related-block">
            <div class="section-head">
              <h2>Mundos vinculados</h2>
              <a routerLink="/mundos">Explorar atlas</a>
            </div>
            <div class="world-grid">
              @for (world of currentNovel.worlds; track world.id) {
                <app-world-card [world]="world" />
              }
            </div>
          </section>
        }

        @if (currentNovel.characters.length || currentNovel.communityCharacters?.length) {
          <section class="related-block">
            <div class="section-head">
              <h2>Personajes</h2>
              <a routerLink="/personajes">Explorar personajes</a>
            </div>

            @if (currentNovel.communityCharacters?.length) {
              @if (currentNovel.novelType === 'FANFIC' && currentNovel.linkedCommunity) {
                <h3 class="char-group-title">Personajes del fandom</h3>
              }
              <div class="character-grid">
                @for (cc of currentNovel.communityCharacters!; track cc.id) {
                  <article class="cc-mini">
                    <div class="avatar">
                      @if (cc.avatarUrl) {
                        <img [src]="cc.avatarUrl" [alt]="cc.name" loading="lazy" />
                      } @else {
                        <span>{{ cc.name.charAt(0) }}</span>
                      }
                    </div>
                    <div class="body">
                      <strong>{{ cc.name }}</strong>
                      @if (currentNovel.linkedCommunity) {
                        <span class="canon-badge">
                          Canon de {{ currentNovel.linkedCommunity.name }}
                        </span>
                      }
                    </div>
                  </article>
                }
              </div>
            }

            @if (currentNovel.characters.length) {
              @if (
                currentNovel.novelType === 'FANFIC' && currentNovel.communityCharacters?.length
              ) {
                <h3 class="char-group-title">Personajes originales</h3>
              }
              <div class="character-grid">
                @for (character of currentNovel.characters; track character.id) {
                  <app-character-card [character]="character" />
                }
              </div>
            }
          </section>
        }

        @if (currentNovel.viewerContext?.isAuthor) {
          <section class="related-block">
            <div class="section-head">
              <h2>Timeline</h2>
              @if (timeline()) {
                <a [routerLink]="['/mis-timelines', timeline()!.id]">Abrir timeline completo</a>
              }
            </div>
            @if (timeline(); as tl) {
              <div class="timeline-summary card">
                <h3>{{ tl.name }}</h3>
                @if (tl.description) {
                  <p class="tl-desc">{{ tl.description }}</p>
                }
              </div>
              @if (tl.events.length) {
                <div class="tl-events-list">
                  @for (evt of tl.events; track evt.id) {
                    <div class="tl-event-row">
                      <span class="tl-event-icon">{{ eventTypeIcons[evt.type] || '📌' }}</span>
                      <div class="tl-event-info">
                        <strong>{{ evt.title }}</strong>
                        @if (evt.dateLabel) {
                          <small>{{ evt.dateLabel }}</small>
                        }
                      </div>
                      <span
                        class="tl-relevance"
                        [class]="'tl-relevance-' + evt.relevance.toLowerCase()"
                        >{{ evt.relevance }}</span
                      >
                    </div>
                  }
                </div>
              }
            } @else {
              <div class="timeline-empty card">
                <p>Organiza la cronologia de tu historia.</p>
                <button
                  type="button"
                  class="tl-create-btn"
                  (click)="createTimeline(currentNovel.slug)"
                >
                  Crear timeline
                </button>
              </div>
            }
          </section>
        }

        <app-linked-visual-boards-section
          [linkedType]="'novel'"
          [linkedId]="currentNovel.id"
          [authorUsername]="currentNovel.author.username"
          [entityLabel]="'novela'"
          [isOwner]="currentNovel.viewerContext?.isAuthor ?? false"
        />

        <app-novel-detail-comments
          [comments]="novelComments()"
          [loading]="novelCommentsLoading()"
          [hasMore]="commentsHasMore()"
          [isAuthenticated]="authService.isAuthenticated()"
          [isAuthor]="currentNovel.viewerContext?.isAuthor ?? false"
          [commentsEnabled]="commentsEnabled()"
          [commentText]="newComment"
          [commentSending]="commentSending()"
          (addComment)="submitComment(currentNovel.slug, $event)"
          (deleteComment)="removeComment(currentNovel.slug, $event)"
          (loadMore)="loadMoreComments(currentNovel.slug)"
          (commentTextChange)="newComment = $event"
        />
      </section>
    }

    @if (showRecommendPreview()) {
      <div class="recommend-overlay" (click)="closeRecommendPreview()">
        <div class="recommend-modal" (click)="$event.stopPropagation()">
          <h3>{{ 'recommend.modalTitle' | translate }}</h3>

          <div class="recommend-novel-preview">
            @if (novel()?.coverUrl) {
              <img [src]="novel()!.coverUrl!" [alt]="novel()!.title" loading="lazy" />
            } @else {
              <div class="preview-cover-placeholder">{{ novel()!.title.charAt(0) }}</div>
            }
            <div class="preview-info">
              <strong>{{ novel()!.title }}</strong>
              <span>por @{{ novel()!.author.username }}</span>
              @if (novel()!.synopsis) {
                <p>{{ novel()!.synopsis! | slice: 0 : 150 }}...</p>
              }
            </div>
          </div>

          <textarea
            [(ngModel)]="recommendMessage"
            rows="3"
            [placeholder]="'recommend.placeholder' | translate"
          ></textarea>

          <div class="recommend-actions">
            <button type="button" class="btn-cancel" (click)="closeRecommendPreview()">
              {{ 'recommend.cancel' | translate }}
            </button>
            <button
              type="button"
              class="btn-confirm"
              [disabled]="recommending()"
              (click)="confirmRecommend()"
            >
              {{
                recommending()
                  ? ('recommend.confirming' | translate)
                  : ('recommend.confirm' | translate)
              }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .detail-shell,
      .card,
      .related-block {
        display: grid;
        gap: 1rem;
      }
      .section-head {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: 1fr auto;
        align-items: center;
      }
      .section-head a {
        color: var(--accent-text);
        text-decoration: none;
      }
      .section-head a:hover {
        color: var(--accent);
      }
      .card {
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        padding: 1.25rem;
      }
      .content-grid {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: 1fr 280px;
        margin-top: 1.5rem;
      }
      .world-grid,
      .character-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .char-group-title {
        margin: 1rem 0 0.5rem;
        font-size: 0.95rem;
        color: var(--text-2);
      }
      .character-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.75rem;
      }
      .cc-mini {
        display: grid;
        grid-template-columns: 48px 1fr;
        gap: 0.5rem;
        padding: 0.6rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--bg-card);
      }
      .cc-mini .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--bg-surface);
        overflow: hidden;
        display: grid;
        place-items: center;
      }
      .cc-mini .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .cc-mini .body {
        display: grid;
        gap: 0.2rem;
      }
      .canon-badge {
        display: inline-block;
        background: var(--accent-glow);
        color: var(--accent-text);
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.7rem;
        width: fit-content;
      }
      .timeline-summary,
      .timeline-empty {
        text-align: center;
      }
      .tl-desc {
        color: var(--text-2);
        font-size: 0.85rem;
        margin: 0;
      }
      .tl-count {
        display: inline-block;
        padding: 0.3rem 0.7rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.8rem;
        font-weight: 600;
      }
      .timeline-empty p {
        color: var(--text-3);
        margin: 0;
      }
      .tl-create-btn {
        padding: 0.6rem 1.2rem;
        border-radius: 1rem;
        border: 1px dashed var(--border-s);
        background: transparent;
        color: var(--accent-text);
        cursor: pointer;
        font-size: 0.85rem;
      }
      .tl-create-btn:hover {
        background: var(--accent-glow);
      }
      .tl-events-list {
        display: grid;
        gap: 0;
        border: 1px solid var(--border);
        border-radius: 1rem;
        overflow: hidden;
      }
      .tl-event-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.7rem 1rem;
        border-bottom: 1px solid var(--border);
        background: var(--bg-card);
      }
      .tl-event-row:last-child {
        border-bottom: none;
      }
      .tl-event-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
      }
      .tl-event-info {
        flex: 1;
        display: grid;
        gap: 0.15rem;
        min-width: 0;
      }
      .tl-event-info strong {
        font-size: 0.85rem;
        color: var(--text-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tl-event-info small {
        font-size: 0.75rem;
        color: var(--text-3);
      }
      .tl-relevance {
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.65rem;
        font-weight: 600;
        flex-shrink: 0;
      }
      .tl-relevance-critical {
        background: rgba(224, 85, 85, 0.15);
        color: #e05555;
      }
      .tl-relevance-major {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }
      .tl-relevance-minor {
        background: rgba(201, 168, 76, 0.15);
        color: var(--accent-text);
      }
      .tl-relevance-background {
        background: var(--bg-surface);
        color: var(--text-3);
      }
      .tl-see-all {
        display: block;
        text-align: center;
        padding: 0.6rem;
        background: var(--bg-surface);
        color: var(--accent-text);
        font-size: 0.8rem;
        text-decoration: none;
      }
      .tl-see-all:hover {
        background: var(--accent-glow);
      }
      .recommend-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: grid;
        place-items: center;
        z-index: var(--z-dialog);
        padding: 1rem;
      }
      .recommend-modal {
        display: grid;
        gap: 1rem;
        width: 100%;
        max-width: 480px;
        padding: 1.5rem;
        border-radius: 1.25rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
      }
      .recommend-modal h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-1);
      }
      .recommend-novel-preview {
        display: flex;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .recommend-novel-preview img {
        width: 60px;
        height: 80px;
        border-radius: 0.5rem;
        object-fit: cover;
        flex-shrink: 0;
      }
      .preview-cover-placeholder {
        width: 60px;
        height: 80px;
        border-radius: 0.5rem;
        background: var(--accent-glow);
        color: var(--accent-text);
        display: grid;
        place-items: center;
        font-size: 1.5rem;
        font-weight: 700;
        flex-shrink: 0;
      }
      .preview-info {
        display: grid;
        gap: 0.15rem;
        align-content: start;
        min-width: 0;
      }
      .preview-info strong {
        color: var(--text-1);
        font-size: 0.9rem;
      }
      .preview-info span {
        color: var(--text-3);
        font-size: 0.8rem;
      }
      .preview-info p {
        margin: 0;
        color: var(--text-2);
        font-size: 0.8rem;
        line-height: 1.4;
      }
      .recommend-modal textarea {
        width: 100%;
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.85rem;
        resize: vertical;
        font-family: inherit;
      }
      .recommend-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .btn-cancel {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .btn-cancel:hover {
        border-color: var(--accent);
      }
      .btn-confirm {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        border: none;
        background: var(--accent);
        color: #fff;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .btn-confirm:hover {
        box-shadow: 0 0 12px var(--accent-glow);
      }
      .btn-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      @media (max-width: 900px) {
        .content-grid,
        .world-grid,
        .character-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovelDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly novelsService = inject(NovelsService);
  private readonly kudosService = inject(KudosService);
  private readonly subscriptionsService = inject(SubscriptionsService);
  private readonly readingListsService = inject(ReadingListsService);
  private readonly timelineService = inject(TimelineService);
  readonly authService = inject(AuthService);
  private readonly postsService = inject(PostsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly novel = signal<NovelDetail | null>(null);
  readonly timeline = signal<TimelineDetail | null>(null);
  readonly readingLists = signal<ReadingList[]>([]);
  readonly showListsMenu = signal(false);
  readonly listMembership = signal(new Set<string>());
  readonly listsLoading = signal(false);
  readonly listsError = signal<string | null>(null);
  readonly listsMessage = signal<string | null>(null);
  readonly listActionId = signal<string | null>(null);
  readonly kudoLoading = signal(false);
  readonly kudoBeat = signal(false);
  readonly recommending = signal(false);
  readonly recommended = signal(false);
  readonly showRecommendPreview = signal(false);
  recommendMessage = '';

  readonly novelComments = signal<import('../../core/services/novels.service').NovelCommentModel[]>(
    [],
  );
  readonly novelCommentsLoading = signal(false);
  readonly commentsCursor = signal<string | null>(null);
  readonly commentsHasMore = signal(false);
  readonly commentsEnabled = signal(true);
  readonly commentSending = signal(false);
  newComment = '';
  readonly subscribeLoading = signal(false);
  readonly eventTypeIcons = EVENT_TYPE_ICONS;

  toggleSubscription() {
    const novel = this.novel();
    if (!novel) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const ctx = novel.viewerContext;
    if (!ctx) return;

    const wasSubscribed = ctx.isSubscribed;
    this.novel.set({
      ...novel,
      stats: {
        ...novel.stats,
        subscribersCount: novel.stats.subscribersCount + (wasSubscribed ? -1 : 1),
      },
      viewerContext: { ...ctx, isSubscribed: !wasSubscribed },
    });
    this.subscribeLoading.set(true);
    const action = wasSubscribed
      ? this.subscriptionsService.unsubscribe(novel.slug)
      : this.subscriptionsService.subscribe(novel.slug);

    action.subscribe({
      next: (res) => {
        const latest = this.novel();
        if (!latest) return;
        this.novel.set({
          ...latest,
          stats: { ...latest.stats, subscribersCount: res.subscribersCount },
          viewerContext: latest.viewerContext
            ? { ...latest.viewerContext, isSubscribed: res.isSubscribed }
            : null,
        });
        this.subscribeLoading.set(false);
      },
      error: () => {
        const latest = this.novel();
        if (latest) {
          this.novel.set({
            ...latest,
            stats: {
              ...latest.stats,
              subscribersCount: novel.stats.subscribersCount,
            },
            viewerContext: latest.viewerContext
              ? { ...latest.viewerContext, isSubscribed: wasSubscribed }
              : null,
          });
        }
        this.subscribeLoading.set(false);
      },
    });
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        return;
      }

      this.error.set(false);
      this.showListsMenu.set(false);
      this.listsError.set(null);
      this.listsMessage.set(null);
      this.listActionId.set(null);
      this.readingLists.set([]);
      this.listMembership.set(new Set<string>());
      this.loading.set(true);
      this.timeline.set(null);
      this.novelsService.getBySlug(slug).subscribe({
        next: (novel) => {
          this.novel.set(novel);
          this.loadComments(slug, true);
          if (this.authService.isAuthenticated()) {
            this.loadReadingLists(novel.id);
            if (novel.viewerContext?.isAuthor) {
              this.loadTimeline(novel.slug);
            }
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    });
  }

  toggleBookmark() {
    const novel = this.novel();
    if (!novel) {
      return;
    }

    this.novelsService.toggleBookmark(novel.slug).subscribe((response) => {
      this.novel.set({
        ...novel,
        stats: {
          ...novel.stats,
          bookmarksCount: novel.stats.bookmarksCount + (response.hasBookmarked ? 1 : -1),
        },
        viewerContext: novel.viewerContext
          ? { ...novel.viewerContext, hasBookmarked: response.hasBookmarked }
          : null,
      });
    });
  }

  toggleKudo() {
    const novel = this.novel();
    if (!novel) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.kudoLoading.set(true);
    const action = novel.viewerContext?.hasKudo
      ? this.kudosService.removeKudo(novel.slug)
      : this.kudosService.addKudo(novel.slug);

    action.subscribe({
      next: (response) => {
        this.novel.set({
          ...novel,
          stats: { ...novel.stats, kudosCount: response.kudosCount },
          viewerContext: novel.viewerContext
            ? { ...novel.viewerContext, hasKudo: response.hasKudo }
            : null,
        });
        if (response.hasKudo) {
          this.kudoBeat.set(true);
          setTimeout(() => this.kudoBeat.set(false), 300);
        }
        this.kudoLoading.set(false);
      },
      error: () => this.kudoLoading.set(false),
    });
  }

  toggleListsMenu() {
    if (this.listsLoading()) {
      return;
    }

    this.showListsMenu.update((value) => !value);
  }

  toggleListMembership(list: ReadingList) {
    const novel = this.novel();
    if (!novel || this.listActionId()) {
      return;
    }

    const alreadyIncluded = this.listMembership().has(list.id);
    this.listActionId.set(list.id);
    this.listsError.set(null);
    this.listsMessage.set(null);

    if (alreadyIncluded) {
      this.readingListsService
        .removeItem(list.id, novel.id)
        .pipe(finalize(() => this.listActionId.set(null)))
        .subscribe({
          next: () => {
            this.listsMessage.set(`"${list.name}" actualizada.`);
            this.loadReadingLists(novel.id, false);
          },
          error: () => {
            this.listsError.set('No se pudo quitar la novela de la lista.');
          },
        });
      return;
    }

    this.readingListsService
      .addItem(list.id, { novelId: novel.id })
      .pipe(finalize(() => this.listActionId.set(null)))
      .subscribe({
        next: () => {
          this.listsMessage.set(`"${list.name}" actualizada.`);
          this.loadReadingLists(novel.id, false);
        },
        error: () => {
          this.listsError.set('No se pudo guardar la novela en la lista.');
        },
      });
  }

  createTimeline(novelSlug: string) {
    this.timelineService.getByNovelSlug(novelSlug).subscribe({
      next: (tl) => this.timeline.set(tl),
    });
  }

  openRecommendPreview() {
    const n = this.novel();
    if (!n) return;
    this.recommendMessage = `Recomiendo "${n.title}" de @${n.author.username}`;
    this.showRecommendPreview.set(true);
  }

  closeRecommendPreview() {
    this.showRecommendPreview.set(false);
  }

  confirmRecommend() {
    const n = this.novel();
    if (!n || this.recommending()) return;
    this.recommending.set(true);
    this.postsService
      .create({
        content: this.recommendMessage.trim() || `Recomiendo "${n.title}"`,
        type: 'RECOMMENDATION',
        novelId: n.id,
      })
      .subscribe({
        next: () => {
          this.recommending.set(false);
          this.recommended.set(true);
          this.showRecommendPreview.set(false);
        },
        error: () => {
          this.recommending.set(false);
        },
      });
  }

  // ── Novel Comments ──

  loadComments(slug: string, reset: boolean) {
    this.novelCommentsLoading.set(true);
    this.novelsService.listComments(slug, reset ? null : this.commentsCursor(), 20).subscribe({
      next: (res) => {
        const list = reset ? res.data : [...this.novelComments(), ...res.data];
        this.novelComments.set(list);
        this.commentsCursor.set(res.pagination.nextCursor);
        this.commentsHasMore.set(res.pagination.hasMore);
        this.commentsEnabled.set(res.commentsEnabled);
        this.novelCommentsLoading.set(false);
      },
      error: () => this.novelCommentsLoading.set(false),
    });
  }

  loadMoreComments(slug: string) {
    this.loadComments(slug, false);
  }

  submitComment(slug: string, text: string) {
    if (!text.trim() || this.commentSending()) return;
    this.commentSending.set(true);
    this.novelsService.createComment(slug, text.trim()).subscribe({
      next: (comment) => {
        this.novelComments.update((list) => [...list, comment]);
        this.newComment = '';
        this.commentSending.set(false);
      },
      error: () => this.commentSending.set(false),
    });
  }

  removeComment(slug: string, commentId: string) {
    this.novelsService.deleteComment(slug, commentId).subscribe({
      next: () => {
        this.novelComments.update((list) => list.filter((c) => c.id !== commentId));
      },
    });
  }

  private loadTimeline(novelSlug: string) {
    this.timelineService.getByNovelSlug(novelSlug).subscribe({
      next: (detail) => this.timeline.set(detail),
      error: () => this.timeline.set(null),
    });
  }

  private loadReadingLists(novelId: string, showLoader = true) {
    if (showLoader) {
      this.listsLoading.set(true);
    }

    this.listsError.set(null);
    this.readingListsService
      .listMine(novelId)
      .pipe(finalize(() => this.listsLoading.set(false)))
      .subscribe({
        next: (lists) => {
          this.readingLists.set(lists);
          this.listMembership.set(
            new Set(lists.filter((list) => list.contains_novel).map((list) => list.id)),
          );
        },
        error: () => {
          this.readingLists.set([]);
          this.listMembership.set(new Set<string>());
          this.listsError.set('No se pudieron cargar tus listas.');
        },
      });
  }
}
