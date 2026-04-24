import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthorAnalytics, AudienceStats } from '../../core/models/author-analytics.model';
import { AuthorSnapshot, SnapshotTimeline } from '../../core/models/snapshot.model';
import { MetricCardComponent } from './components/metric-card.component';
import { PeriodSelectorComponent } from './components/period-selector.component';
import { TimeSeriesChartComponent } from './components/time-series-chart.component';
import { TopNovelsTableComponent, TopNovelRow } from './components/top-novels-table.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { GenreLabelPipe } from '../../shared/pipes/genre-label.pipe';

type TimelineMetric = 'newFollowers' | 'profileViews' | 'postReactions';

@Component({
  selector: 'app-author-analytics-page',
  standalone: true,
  imports: [
    DecimalPipe,
    MetricCardComponent,
    PeriodSelectorComponent,
    TimeSeriesChartComponent,
    TopNovelsTableComponent,
    TranslatePipe,
    GenreLabelPipe,
  ],
  template: `
    <section class="analytics-page">
      <header class="page-header">
        <h1>{{ 'analytics.title' | translate }}</h1>
        <app-period-selector [selected]="period()" (periodChange)="onPeriodChange($event)" />
      </header>

      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (!data()) {
        <div class="loading">No hay datos para mostrar.</div>
      } @else if (data()) {
        <!-- Metric Cards -->
        <div class="metrics-row">
          <app-metric-card
            icon="👁"
            label="Vistas totales"
            [value]="(data()!.totals.totalViews | number) || '0'"
            [delta]="null"
            [pct]="null"
          />
          <app-metric-card
            icon="❤"
            label="Likes totales"
            [value]="(data()!.totals.totalLikes | number) || '0'"
            [delta]="null"
            [pct]="null"
          />
          <app-metric-card
            icon="📚"
            label="Novelas publicadas"
            [value]="data()!.totals.publishedNovels"
            [delta]="null"
            [pct]="null"
          />
          <app-metric-card
            icon="👥"
            label="Lectores"
            [value]="(data()!.totals.totalReadersUnique | number) || '0'"
            [delta]="null"
            [pct]="null"
          />
          <app-metric-card
            icon="👤"
            label="Seguidores"
            [value]="(data()!.totals.totalFollowers | number) || '0'"
            [delta]="null"
            [pct]="null"
          />
          <app-metric-card
            icon="✍"
            label="Palabras publicadas"
            [value]="(data()!.totals.totalWordsPublished | number) || '0'"
            [delta]="null"
            [pct]="null"
          />
        </div>

        <!-- Timeline Chart -->
        @if (timeline()) {
          <section class="section">
            <div class="section-head">
              <h2>Tendencia</h2>
              <div class="metric-toggle">
                @for (m of timelineMetrics; track m.key) {
                  <button
                    type="button"
                    class="toggle-btn"
                    [class.active]="selectedMetric() === m.key"
                    (click)="selectedMetric.set(m.key)"
                  >
                    {{ m.label }}
                  </button>
                }
              </div>
            </div>
            <app-time-series-chart
              [labels]="chartLabels()"
              [values]="chartValues()"
              [label]="selectedMetricLabel()"
            />
          </section>
        }

        <!-- Top Novels -->
        @if (novelRows().length) {
          <section class="section">
            <h2>Novelas destacadas</h2>
            <app-top-novels-table [novels]="novelRows()" />
          </section>
        }

        <!-- Audience -->
        <section class="section">
          <button
            type="button"
            class="expand-btn"
            (click)="audienceExpanded.set(!audienceExpanded())"
          >
            <h2>Audiencia</h2>
            <span class="chevron" [class.open]="audienceExpanded()">&#9660;</span>
          </button>

          @if (audienceExpanded() && audience()) {
            <div class="audience-grid">
              <div class="audience-card">
                <span class="audience-label">Seguidores</span>
                <span class="audience-value">{{ audience()!.followers.total | number }}</span>
                <span class="audience-sub">+{{ audience()!.followers.growth30d }} (30d)</span>
              </div>
              <div class="audience-card">
                <span class="audience-label">Lectores únicos</span>
                <span class="audience-value">{{ audience()!.readers.totalUnique | number }}</span>
                <span class="audience-sub">{{ audience()!.readers.retentionRate }}% retención</span>
              </div>
              <div class="audience-card">
                <span class="audience-label">Lectores recurrentes</span>
                <span class="audience-value">{{ audience()!.readers.returning | number }}</span>
              </div>
              <div class="audience-card">
                <span class="audience-label">Likes/novela</span>
                <span class="audience-value">{{ audience()!.engagement.avgLikesPerNovel }}</span>
              </div>
              <div class="audience-card">
                <span class="audience-label">Lectores/novela</span>
                <span class="audience-value">{{ audience()!.engagement.avgReadersPerNovel }}</span>
              </div>
              <div class="audience-card">
                <span class="audience-label">% completado prom.</span>
                <span class="audience-value">{{ audience()!.engagement.avgCompletionRate }}%</span>
              </div>
            </div>

            @if (audience()!.topGenres.length) {
              <div class="top-genres">
                <h3>Géneros principales</h3>
                <div class="genre-chips">
                  @for (g of audience()!.topGenres; track g.genre.slug) {
                    <span class="genre-chip">{{ g.genre | genreLabel }}</span>
                  }
                </div>
              </div>
            }
          }
        </section>
      }
    </section>
  `,
  styles: `
    .analytics-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 20px;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 28px;
    }
    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-1);
      margin: 0;
    }
    .loading {
      text-align: center;
      padding: 60px 0;
      color: var(--text-3);
    }
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section h2 {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-1);
      margin: 0 0 16px;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }
    .section-head h2 {
      margin: 0;
    }
    .metric-toggle {
      display: flex;
      gap: 6px;
    }
    .toggle-btn {
      padding: 4px 12px;
      border-radius: 16px;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-2);
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .toggle-btn:hover {
      border-color: var(--accent);
    }
    .toggle-btn.active {
      background: var(--accent);
      color: var(--accent-text);
      border-color: var(--accent);
    }
    .expand-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      margin-bottom: 16px;
    }
    .expand-btn h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-1);
    }
    .chevron {
      font-size: 0.7rem;
      color: var(--text-3);
      transition: transform 0.2s;
    }
    .chevron.open {
      transform: rotate(180deg);
    }
    .audience-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .audience-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .audience-label {
      font-size: 0.78rem;
      color: var(--text-3);
    }
    .audience-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-1);
    }
    .audience-sub {
      font-size: 0.78rem;
      color: var(--text-2);
    }
    .top-genres {
      margin-top: 12px;
    }
    .top-genres h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-2);
      margin: 0 0 8px;
    }
    .genre-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .genre-chip {
      padding: 4px 12px;
      border-radius: 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      font-size: 0.8rem;
      color: var(--text-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorAnalyticsPageComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly period = signal('30d');
  readonly loading = signal(false);
  readonly data = signal<AuthorAnalytics | null>(null);
  readonly timeline = signal<SnapshotTimeline<AuthorSnapshot> | null>(null);
  readonly audience = signal<AudienceStats | null>(null);
  readonly audienceExpanded = signal(false);
  readonly selectedMetric = signal<TimelineMetric>('newFollowers');

  readonly timelineMetrics: { key: TimelineMetric; label: string }[] = [
    { key: 'newFollowers', label: 'Seguidores' },
    { key: 'profileViews', label: 'Vistas perfil' },
    { key: 'postReactions', label: 'Reacciones' },
  ];

  readonly selectedMetricLabel = computed(() => {
    return this.timelineMetrics.find((m) => m.key === this.selectedMetric())?.label ?? '';
  });

  readonly chartLabels = computed(() => {
    const tl = this.timeline();
    if (!tl) return [];
    return tl.snapshots.map((s) => {
      const d = new Date(s.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
  });

  readonly chartValues = computed(() => {
    const tl = this.timeline();
    if (!tl) return [];
    const key = this.selectedMetric();
    return tl.snapshots.map((s) => s[key]);
  });

  readonly novelRows = computed<TopNovelRow[]>(() => {
    const d = this.data();
    if (!d) return [];
    return d.topNovels.map((n) => ({
      novel: { id: n.novel.id, title: n.novel.title, slug: n.novel.slug },
      views: n.views,
      likes: n.likes,
      readers: n.readers,
      completionRate: n.completionRate,
    }));
  });

  ngOnInit(): void {
    this.loadData();
    this.loadAudience();
  }

  onPeriodChange(period: string): void {
    this.period.set(period);
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    const p = this.period();

    this.analyticsService.getAuthorAnalytics(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.analyticsService.getAuthorTimeline(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (tl) => this.timeline.set(tl),
    });
  }

  private loadAudience(): void {
    this.analyticsService.getAudience().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (a) => this.audience.set(a),
    });
  }
}
