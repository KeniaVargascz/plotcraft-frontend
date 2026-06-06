import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ThreadSummary } from '../../core/models/forum-thread.model';
import { ForumService } from '../../core/services/forum.service';
import { ListSkeletonComponent } from '../../shared/components/skeleton-loader/list-skeleton.component';
import { ThreadCardComponent } from './components/thread-card.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-archived-threads-page',
  standalone: true,
  imports: [RouterLink, ListSkeletonComponent, ThreadCardComponent, TranslatePipe],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <a class="back-arrow" routerLink="/foro" [title]="'actions.back' | translate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </a>
        <h1>Mis hilos archivados</h1>
        <p class="subtitle">Hilos que archivaste. Solo tu puedes verlos aqui.</p>
      </header>

      @if (loading()) {
        <app-list-skeleton />
      } @else {
        @if (archivedThreads().length) {
          <div class="thread-list">
            @for (thread of archivedThreads(); track thread.id) {
              <app-thread-card
                [thread]="thread"
                [showArchiveBtn]="true"
                (restore)="onRestore($event)"
              />
            }
          </div>
        } @else {
          <div class="empty">
            <p>No tienes hilos archivados.</p>
            <a routerLink="/foro" class="back-btn">Ir al foro</a>
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      .page-shell {
        max-width: 800px;
        margin: 0 auto;
        padding: 1.5rem;
      }
      .page-header {
        margin-bottom: 1.5rem;
      }
      .back-arrow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
        flex-shrink: 0;
      }
      .back-arrow svg { width: 1.2rem; height: 1.2rem; }
      .back-arrow:hover { background: var(--accent-glow); color: var(--accent-text); }
      h1 {
        font-size: 1.5rem;
        color: var(--text-1);
        margin: 0.5rem 0 0.25rem;
      }
      .subtitle {
        font-size: 0.85rem;
        color: var(--text-3);
        margin: 0;
      }
      .thread-list {
        display: grid;
        gap: 0.75rem;
      }
      .empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-3);
      }
      .empty p {
        margin: 0 0 1rem;
      }
      .back-btn {
        display: inline-block;
        padding: 0.5rem 1.5rem;
        border-radius: 0.75rem;
        background: var(--accent-glow);
        color: var(--accent-text);
        text-decoration: none;
        font-size: 0.85rem;
      }
      .back-btn:hover {
        background: var(--accent);
        color: #fff;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivedThreadsPageComponent implements OnInit {
  private readonly forumService = inject(ForumService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly archivedThreads = signal<ThreadSummary[]>([]);

  ngOnInit() {
    this.forumService.listMyThreads({ limit: 50 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.archivedThreads.set(res.data.filter((t) => t.status === 'ARCHIVED'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onRestore(thread: ThreadSummary) {
    this.forumService.openThread(thread.slug).subscribe({
      next: () => {
        this.archivedThreads.update((list) => list.filter((t) => t.id !== thread.id));
      },
    });
  }
}
