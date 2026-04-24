import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LibrarySummary } from '../../core/models/library.model';
import { LibraryService } from '../../core/services/library.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="library-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">{{ 'library.title' | translate }}</p>
          <h1>{{ 'library.title' | translate }}</h1>
        </div>
      </header>

      @if (loading()) {
        <p class="status">{{ 'common.loading' | translate }}</p>
      } @else if (summary(); as current) {
        <section class="grid">
          <a class="card nav-card" routerLink="/biblioteca/en-progreso">
            <strong>{{ 'library.inProgress' | translate }}</strong>
            <span>{{ current.inProgress.length }} novelas</span>
          </a>
          <a class="card nav-card" routerLink="/biblioteca/historial">
            <strong>{{ 'library.history' | translate }}</strong>
            <span>{{ 'library.lastRead' | translate: { time: 'reciente' } }}</span>
          </a>
          <a class="card nav-card" routerLink="/biblioteca/marcadores">
            <strong>{{ 'library.bookmarks' | translate }}</strong>
            <span>{{ current.bookmarked.length }} novelas</span>
          </a>
          <a class="card nav-card" routerLink="/biblioteca/listas">
            <strong>{{ 'library.listsTitle' | translate }}</strong>
            <span>{{ current.readingLists.length }} listas</span>
          </a>
        </section>

        <section class="content-grid">
          <article class="card">
            <div class="section-head">
              <h2>{{ 'library.inProgress' | translate }}</h2>
              <a routerLink="/biblioteca/en-progreso">{{ 'feed.loadMore' | translate }}</a>
            </div>

            @if (!current.inProgress.length) {
              <p>{{ 'library.empty.inProgress' | translate }}</p>
            } @else {
              @for (item of current.inProgress; track item.id) {
                <a class="row-link" [routerLink]="['/novelas', item.slug]">
                  <strong>{{ item.title }}</strong>
                  <span>
                    {{
                      'library.resumeFrom'
                        | translate
                          : {
                              n: item.readingProgress?.chapterOrder ?? 1,
                              title:
                                item.readingProgress?.chapterTitle ??
                                item.lastChapter?.title ??
                                item.title,
                            }
                    }}
                  </span>
                </a>
              }
            }
          </article>

          <article class="card">
            <div class="section-head">
              <h2>{{ 'library.goalsTitle' | translate }}</h2>
              <a routerLink="/biblioteca/metas">{{ 'common.save' | translate }}</a>
            </div>

            @if (current.activeGoal; as activeGoal) {
              <div class="goal-meter">
                <div class="goal-value">
                  {{ (activeGoal.progress.pctComplete * 100).toFixed(0) }}%
                </div>
                <p>
                  {{ activeGoal.progress.wordsRead }} / {{ activeGoal.targetWords }}
                  {{ 'library.goals.targetWords' | translate }}
                </p>
              </div>
            } @else {
              <p>{{ 'library.empty.goals' | translate }}</p>
            }
          </article>
        </section>
      }
    </section>
  `,
  styles: [
    `
      .library-shell,
      .grid,
      .content-grid,
      .card {
        display: grid;
        gap: 1rem;
      }
      .grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .content-grid {
        grid-template-columns: 1.2fr 0.8fr;
      }
      .card {
        padding: 1.1rem;
        border: 1px solid var(--border);
        border-radius: 1.25rem;
        background: var(--bg-card);
      }
      .nav-card,
      .row-link {
        color: inherit;
        text-decoration: none;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }
      .goal-meter {
        display: grid;
        place-items: start;
        gap: 0.5rem;
      }
      .goal-value {
        font-size: 2rem;
        color: var(--accent-text);
      }
      .status,
      .eyebrow {
        color: var(--text-2);
      }
      @media (max-width: 900px) {
        .grid,
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryPageComponent {
  private readonly libraryService = inject(LibraryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly summary = signal<LibrarySummary | null>(null);

  constructor() {
    this.libraryService
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe((summary) => this.summary.set(summary));
  }
}
