import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThreadSummary } from '../../core/models/forum-thread.model';
import { ForumService } from '../../core/services/forum.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ThreadCardComponent } from './components/thread-card.component';

@Component({
  selector: 'app-archived-threads-page',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ThreadCardComponent],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <a class="back-link" routerLink="/foro">&larr; Volver al foro</a>
        <h1>Mis hilos archivados</h1>
        <p class="subtitle">Hilos que archivaste. Solo tu puedes verlos aqui.</p>
      </header>

      @if (loading()) {
        <app-loading-spinner />
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
  styles: [`
    .page-shell {
      max-width: 800px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    .page-header { margin-bottom: 1.5rem; }
    .back-link {
      font-size: 0.85rem;
      color: var(--text-3);
      text-decoration: none;
    }
    .back-link:hover { color: var(--accent-text); }
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
    .empty p { margin: 0 0 1rem; }
    .back-btn {
      display: inline-block;
      padding: 0.5rem 1.25rem;
      border-radius: 0.75rem;
      background: var(--accent-glow);
      color: var(--accent-text);
      text-decoration: none;
      font-size: 0.85rem;
    }
    .back-btn:hover { background: var(--accent); color: #fff; }
  `],
})
export class ArchivedThreadsPageComponent implements OnInit {
  private readonly forumService = inject(ForumService);

  readonly loading = signal(true);
  readonly archivedThreads = signal<ThreadSummary[]>([]);

  ngOnInit() {
    this.forumService.listMyThreads().subscribe({
      next: (threads) => {
        this.archivedThreads.set(threads.filter(t => t.status === 'ARCHIVED'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onRestore(thread: ThreadSummary) {
    this.forumService.openThread(thread.slug).subscribe({
      next: () => {
        this.archivedThreads.update(list => list.filter(t => t.id !== thread.id));
      },
    });
  }
}
