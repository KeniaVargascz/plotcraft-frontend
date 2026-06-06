import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthorAnalytics } from '../../core/models/author-analytics.model';
import { LibrarySummary } from '../../core/models/library.model';
import { NovelSummary } from '../../core/models/novel.model';
import { PlannerStats } from '../../core/models/planner-stats.model';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { LibraryService } from '../../core/services/library.service';
import { NovelsService } from '../../core/services/novels.service';
import { PlannerService } from '../../core/services/planner.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly novelsService = inject(NovelsService);
  private readonly libraryService = inject(LibraryService);
  private readonly plannerService = inject(PlannerService);

  readonly loading = signal(true);
  readonly displayName = signal('');
  readonly analytics = signal<AuthorAnalytics | null>(null);
  readonly novels = signal<NovelSummary[]>([]);
  readonly library = signal<LibrarySummary | null>(null);
  readonly planner = signal<PlannerStats | null>(null);

  readonly statusLabels: Record<string, string> = {
    DRAFT: 'Borrador',
    IN_PROGRESS: 'En progreso',
    COMPLETED: 'Completada',
    ARCHIVED: 'Archivada',
    HIATUS: 'En pausa',
  };

  ngOnInit(): void {
    const user = this.authService.getCurrentUserSnapshot();
    this.displayName.set(user?.profile?.displayName || user?.username || 'Escritor');

    forkJoin({
      analytics: this.analyticsService.getAuthorAnalytics(),
      novels: this.novelsService.listMine({ limit: 5, sort: 'recent' }),
      library: this.libraryService.getSummary(),
      planner: this.plannerService.getStats(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.analytics.set(res.analytics);
          this.novels.set(res.novels.data);
          this.library.set(res.library);
          this.planner.set(res.planner);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  get pendingTasks(): number {
    const p = this.planner();
    return p ? p.totalTasks - p.tasksDone - p.tasksInProgress : 0;
  }
}
