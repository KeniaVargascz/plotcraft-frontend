import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PlannerStats } from '../../core/models/planner-stats.model';
import { PlannerService } from '../../core/services/planner.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { WordProgressBarComponent } from './components/word-progress-bar.component';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'var(--danger)',
  HIGH: '#f59e0b',
  MEDIUM: 'var(--accent)',
  LOW: 'var(--text-3)',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

const TYPE_LABELS: Record<string, string> = {
  CHAPTER: 'Capitulo',
  CHARACTER: 'Personaje',
  WORLDBUILDING: 'Mundo',
  PLANNING: 'Planificacion',
  REVISION: 'Revision',
  RESEARCH: 'Investigacion',
  PUBLICATION: 'Publicacion',
  OTHER: 'Otro',
};

@Component({
  selector: 'app-planner-stats-page',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, WordProgressBarComponent],
  template: `
    <div class="stats-shell">
      <header class="stats-header">
        <a class="back-btn" routerLink="/planner">&larr; Planner</a>
        <h1>Estadisticas</h1>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (stats()) {
        <div class="stats-grid">
          <!-- Row 1: Summary cards -->
          <div class="summary-row">
            <div class="stat-card">
              <span class="stat-value">{{ stats()!.totalTasks }}</span>
              <span class="stat-label">Total tareas</span>
            </div>
            <div class="stat-card accent">
              <span class="stat-value">{{ stats()!.tasksDone }}</span>
              <span class="stat-label">Completadas</span>
            </div>
            <div class="stat-card warn">
              <span class="stat-value">{{ stats()!.tasksInProgress }}</span>
              <span class="stat-label">En progreso</span>
            </div>
            <div class="stat-card danger">
              <span class="stat-value">{{ stats()!.tasksOverdue }}</span>
              <span class="stat-label">Atrasadas</span>
            </div>

            <!-- Completion rate circle -->
            <div class="stat-card circle-card">
              <svg viewBox="0 0 36 36" class="donut completion-donut">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="var(--border)"
                  stroke-width="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="var(--accent)"
                  stroke-width="3"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="completionDash()"
                  stroke-dashoffset="25"
                />
                <text x="18" y="19.5" text-anchor="middle" class="donut-text">
                  {{ stats()!.completionRate }}%
                </text>
              </svg>
              <span class="stat-label">Tasa de completado</span>
            </div>
          </div>

          <!-- Row 2: Word progress -->
          <div class="words-card">
            <h3 class="card-title">Progreso de palabras</h3>
            <app-word-progress-bar
              [actual]="stats()!.wordsWritten"
              [target]="stats()!.wordsTargeted"
            />
            <div class="word-details">
              <span>Escritas: {{ stats()!.wordsWritten.toLocaleString() }}</span>
              <span>Meta: {{ stats()!.wordsTargeted.toLocaleString() }}</span>
            </div>
          </div>

          <!-- Row 3: Bar chart by type -->
          <div class="chart-card">
            <h3 class="card-title">Tareas por tipo</h3>
            <div class="bar-chart">
              @for (entry of typeEntries(); track entry.key) {
                <div class="bar-row">
                  <span class="bar-label">{{ entry.label }}</span>
                  <div class="bar-track">
                    <div
                      class="bar-fill"
                      [style.width.%]="entry.pct"
                      [style.background]="'var(--accent)'"
                    ></div>
                  </div>
                  <span class="bar-count">{{ entry.count }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Row 4: Donut chart by priority -->
          <div class="chart-card">
            <h3 class="card-title">Tareas por prioridad</h3>
            <div class="donut-wrapper">
              <svg viewBox="0 0 36 36" class="donut priority-donut">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="var(--border)"
                  stroke-width="3.8"
                />
                @for (seg of prioritySegments(); track seg.key) {
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    [attr.stroke]="seg.color"
                    stroke-width="3.8"
                    [attr.stroke-dasharray]="seg.dash"
                    [attr.stroke-dashoffset]="seg.offset"
                  />
                }
              </svg>
              <div class="donut-legend">
                @for (seg of prioritySegments(); track seg.key) {
                  <div class="legend-item">
                    <span class="legend-dot" [style.background]="seg.color"></span>
                    <span class="legend-label">{{ seg.label }}: {{ seg.count }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Row 5: Recent completions -->
          <div class="chart-card">
            <h3 class="card-title">Completadas recientemente</h3>
            <div class="completions-list">
              @for (task of stats()!.recentCompletions; track task.id) {
                <a class="completion-item" [routerLink]="['/planner', task.project.id]">
                  <span class="c-check">&#10003;</span>
                  <div class="c-info">
                    <span class="c-title">{{ task.title }}</span>
                    <span class="c-meta"
                      >{{ task.project.name }}
                      @if (task.completedAt) {
                        &middot; {{ formatDate(task.completedAt) }}
                      }
                    </span>
                  </div>
                </a>
              }
              @if (!stats()!.recentCompletions.length) {
                <p class="empty-text">Sin completadas recientes.</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .stats-shell {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem;
        max-width: 1000px;
        margin: 0 auto;
      }
      .stats-header {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .back-btn {
        font-size: 0.85rem;
        color: var(--text-2);
        text-decoration: none;
      }
      .back-btn:hover {
        color: var(--text-1);
      }
      .stats-header h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-1);
        margin: 0;
      }
      .stats-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      /* Summary row */
      .summary-row {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        flex: 1;
        min-width: 120px;
      }
      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-1);
      }
      .stat-card.accent .stat-value {
        color: #22c55e;
      }
      .stat-card.warn .stat-value {
        color: #f59e0b;
      }
      .stat-card.danger .stat-value {
        color: var(--danger);
      }
      .stat-label {
        font-size: 0.75rem;
        color: var(--text-3);
      }
      .circle-card {
        min-width: 140px;
      }
      .completion-donut {
        width: 80px;
        height: 80px;
      }
      .donut-text {
        font-size: 7px;
        font-weight: 700;
        fill: var(--text-1);
      }
      /* Words card */
      .words-card,
      .chart-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 1.25rem;
      }
      .card-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-1);
        margin: 0 0 0.75rem;
      }
      .word-details {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-3);
        margin-top: 0.5rem;
      }
      /* Bar chart */
      .bar-chart {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .bar-row {
        display: flex;
        align-items: center;
        gap: 0.625rem;
      }
      .bar-label {
        font-size: 0.75rem;
        color: var(--text-2);
        min-width: 90px;
        text-align: right;
      }
      .bar-track {
        flex: 1;
        height: 18px;
        border-radius: 4px;
        background: var(--border);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s;
        min-width: 2px;
      }
      .bar-count {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-1);
        min-width: 28px;
      }
      /* Donut chart */
      .donut-wrapper {
        display: flex;
        align-items: center;
        gap: 2rem;
        flex-wrap: wrap;
      }
      .priority-donut {
        width: 120px;
        height: 120px;
      }
      .donut-legend {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .legend-label {
        font-size: 0.8rem;
        color: var(--text-2);
      }
      /* Completions list */
      .completions-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .completion-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.5rem;
        border-radius: 6px;
        text-decoration: none;
        color: inherit;
        transition: background 0.1s;
      }
      .completion-item:hover {
        background: var(--bg-surface);
      }
      .c-check {
        color: #22c55e;
        font-size: 0.85rem;
        flex-shrink: 0;
      }
      .c-info {
        flex: 1;
        min-width: 0;
      }
      .c-title {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .c-meta {
        font-size: 0.7rem;
        color: var(--text-3);
      }
      .empty-text {
        font-size: 0.8rem;
        color: var(--text-3);
        text-align: center;
        padding: 1rem 0;
        margin: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerStatsPageComponent implements OnInit {
  private readonly plannerService = inject(PlannerService);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(true);
  stats = signal<PlannerStats | null>(null);

  completionDash = computed(() => {
    const rate = this.stats()?.completionRate ?? 0;
    return `${rate} ${100 - rate}`;
  });

  typeEntries = computed(() => {
    const byType = this.stats()?.byType ?? {};
    const max = Math.max(1, ...Object.values(byType));
    return Object.entries(byType).map(([key, count]) => ({
      key,
      label: TYPE_LABELS[key] ?? key,
      count,
      pct: (count / max) * 100,
    }));
  });

  prioritySegments = computed(() => {
    const byPriority = this.stats()?.byPriority ?? {};
    const total = Math.max(
      1,
      Object.values(byPriority).reduce((a, b) => a + b, 0),
    );
    const segments: Array<{
      key: string;
      label: string;
      color: string;
      count: number;
      dash: string;
      offset: number;
    }> = [];
    let cumulative = 0;

    for (const key of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      const count = byPriority[key] ?? 0;
      if (count === 0) continue;
      const pct = (count / total) * 100;
      segments.push({
        key,
        label: PRIORITY_LABELS[key] ?? key,
        color: PRIORITY_COLORS[key] ?? 'var(--text-3)',
        count,
        dash: `${pct} ${100 - pct}`,
        offset: 100 - cumulative + 25,
      });
      cumulative += pct;
    }
    return segments;
  });

  ngOnInit(): void {
    this.plannerService.getStats().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
