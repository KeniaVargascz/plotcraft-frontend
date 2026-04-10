import { Component, input } from '@angular/core';
import { DeltaBadgeComponent } from './delta-badge.component';
import { SparklineChartComponent } from './sparkline-chart.component';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [DeltaBadgeComponent, SparklineChartComponent],
  template: `
    <div class="card">
      <div class="header">
        <span class="icon">{{ icon() }}</span>
        <span class="label">{{ label() }}</span>
      </div>
      <div class="value">{{ value() }}</div>
      <div class="footer">
        @if (delta() !== null && pct() !== null) {
          <app-delta-badge [delta]="delta()!" [pct]="pct()!" />
        }
        @if (sparkValues() && sparkValues()!.length > 1) {
          <div class="spark-wrap">
            <app-sparkline-chart [values]="sparkValues()!" />
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-2);
      font-size: 0.85rem;
    }
    .icon {
      font-size: 1.1rem;
    }
    .value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-1);
      line-height: 1.1;
    }
    .footer {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }
    .spark-wrap {
      flex: 1;
      min-width: 60px;
      max-width: 120px;
    }
  `,
})
export class MetricCardComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly delta = input<number | null>(null);
  readonly pct = input<number | null>(null);
  readonly sparkValues = input<number[] | null>(null);
}
