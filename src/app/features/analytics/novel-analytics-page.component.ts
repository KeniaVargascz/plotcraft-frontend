import { DecimalPipe } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ExportsService } from '../../core/services/exports.service';
import { NovelAnalytics } from '../../core/models/novel-analytics.model';
import { NovelSnapshot, SnapshotTimeline } from '../../core/models/snapshot.model';
import { MetricCardComponent } from './components/metric-card.component';
import { PeriodSelectorComponent } from './components/period-selector.component';
import { TimeSeriesChartComponent } from './components/time-series-chart.component';
import { ChapterFunnelComponent } from './components/chapter-funnel.component';

type TimelineMetric = 'views' | 'likes' | 'bookmarks' | 'newReaders' | 'chaptersRead';

@Component({
  selector: 'app-novel-analytics-page',
  standalone: true,
  imports: [
    DecimalPipe,
    MetricCardComponent,
    PeriodSelectorComponent,
    TimeSeriesChartComponent,
    ChapterFunnelComponent,
  ],
  template: `
    <section class="analytics-page">
      @if (data()) {
        <header class="page-header">
          <div class="title-wrap">
            <a class="back-link" href="/analytics">&larr; Analytics</a>
            <h1>{{ data()!.novel.title }}</h1>
          </div>
          <app-period-selector [selected]="period()" (periodChange)="onPeriodChange($event)" />
        </header>
      }

      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (data()) {
        <!-- Metric Cards -->
        <div class="metrics-row">
          <app-metric-card
            icon="👁"
            label="Vistas"
            [value]="(data()!.totals.views | number) || '0'"
            [delta]="getDelta('views')"
            [pct]="getPct('views')"
            [sparkValues]="viewsSpark()"
          />
          <app-metric-card
            icon="❤"
            label="Likes"
            [value]="(data()!.totals.likes | number) || '0'"
            [delta]="getDelta('likes')"
            [pct]="getPct('likes')"
          />
          <app-metric-card
            icon="🔖"
            label="Marcadores"
            [value]="(data()!.totals.bookmarks | number) || '0'"
            [delta]="getDelta('bookmarks')"
            [pct]="getPct('bookmarks')"
          />
          <app-metric-card
            icon="👥"
            label="Lectores"
            [value]="(data()!.totals.totalReaders | number) || '0'"
            [delta]="getDelta('newReaders')"
            [pct]="getPct('newReaders')"
          />
          <app-metric-card
            icon="✅"
            label="Completado"
            [value]="data()!.totals.completionRate + '%'"
            [delta]="null"
            [pct]="null"
          />
          <app-metric-card
            icon="⏱"
            label="Tiempo lectura"
            [value]="data()!.totals.avgReadTimeMin + ' min'"
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

        <!-- Chapter Funnel -->
        @if (data()!.chapters.length) {
          <section class="section">
            <h2>Embudo de capítulos</h2>
            <app-chapter-funnel [chapters]="data()!.chapters" />

            <div class="chapters-table-wrap">
              <table class="chapters-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Capítulo</th>
                    <th class="num">Lecturas</th>
                    <th class="num">Únicas</th>
                    <th class="num">Completado</th>
                    <th class="num">Palabras</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ch of data()!.chapters; track ch.id) {
                    <tr>
                      <td class="order">{{ ch.order }}</td>
                      <td>{{ ch.title }}</td>
                      <td class="num">{{ ch.stats.reads | number }}</td>
                      <td class="num">{{ ch.stats.uniqueReads | number }}</td>
                      <td class="num">{{ ch.stats.completionRate }}%</td>
                      <td class="num">{{ ch.wordCount | number }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        <!-- Export -->
        <section class="section">
          <h2>Exportar novela</h2>
          <div class="export-row">
            <button type="button" class="export-btn" (click)="exportNovel('txt')">📄 TXT</button>
            <button type="button" class="export-btn" (click)="exportNovel('md')">
              🗒 Markdown
            </button>
            <button type="button" class="export-btn" (click)="exportNovel('json')">📦 JSON</button>
          </div>
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
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 28px;
    }
    .title-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .back-link {
      font-size: 0.82rem;
      color: var(--accent);
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
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
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
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
    .chapters-table-wrap {
      margin-top: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow-x: auto;
    }
    .chapters-table {
      width: 100%;
      border-collapse: collapse;
    }
    .chapters-table thead {
      border-bottom: 1px solid var(--border);
    }
    .chapters-table th {
      text-align: left;
      padding: 10px 14px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-3);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .chapters-table td {
      padding: 10px 14px;
      font-size: 0.85rem;
      color: var(--text-1);
      border-bottom: 1px solid var(--border);
    }
    .chapters-table tr:last-child td {
      border-bottom: none;
    }
    .chapters-table .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .chapters-table th.num {
      text-align: right;
    }
    .order {
      color: var(--text-3);
      font-weight: 500;
    }
    .export-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .export-btn {
      padding: 10px 20px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-1);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .export-btn:hover {
      border-color: var(--accent);
      box-shadow: 0 0 8px var(--accent-glow);
    }
  `,
})
export class NovelAnalyticsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly exportsService = inject(ExportsService);

  readonly period = signal('30d');
  readonly loading = signal(false);
  readonly data = signal<NovelAnalytics | null>(null);
  readonly timeline = signal<SnapshotTimeline<NovelSnapshot> | null>(null);
  readonly selectedMetric = signal<TimelineMetric>('views');
  private slug = '';

  readonly timelineMetrics: { key: TimelineMetric; label: string }[] = [
    { key: 'views', label: 'Vistas' },
    { key: 'likes', label: 'Likes' },
    { key: 'bookmarks', label: 'Marcadores' },
    { key: 'newReaders', label: 'Lectores' },
    { key: 'chaptersRead', label: 'Cap. le\u00eddos' },
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

  readonly viewsSpark = computed(() => {
    const tl = this.timeline();
    if (!tl) return null;
    return tl.snapshots.map((s) => s.views);
  });

  ngOnInit(): void {
    this.slug = this.route.snapshot.params['slug'] ?? '';
    this.loadData();
  }

  onPeriodChange(period: string): void {
    this.period.set(period);
    this.loadData();
  }

  getDelta(field: string): number | null {
    const pd = this.data()?.periodDelta as Record<string, { value: number; pct: number }> | null;
    if (!pd || !pd[field]) return null;
    return pd[field].value;
  }

  getPct(field: string): number | null {
    const pd = this.data()?.periodDelta as Record<string, { value: number; pct: number }> | null;
    if (!pd || !pd[field]) return null;
    return pd[field].pct;
  }

  exportNovel(format: 'txt' | 'md' | 'json'): void {
    const slug = this.slug;
    let obs$;
    let filename: string;
    const date = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'txt':
        obs$ = this.exportsService.exportNovelTxt(slug);
        filename = `novel-${slug}-${date}.txt`;
        break;
      case 'md':
        obs$ = this.exportsService.exportNovelMd(slug);
        filename = `novel-${slug}-${date}.md`;
        break;
      case 'json':
        obs$ = this.exportsService.exportNovelJson(slug);
        filename = `novel-${slug}-${date}.json`;
        break;
    }

    obs$.subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  private loadData(): void {
    this.loading.set(true);
    const p = this.period();

    this.analyticsService.getNovelAnalytics(this.slug, p).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.analyticsService.getNovelTimeline(this.slug, p).subscribe({
      next: (tl) => this.timeline.set(tl),
    });
  }
}
