import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-sparkline-chart',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 100 30'" class="sparkline" preserveAspectRatio="none">
      <polyline
        [attr.points]="points()"
        fill="none"
        [attr.stroke]="strokeColor()"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }
    .sparkline {
      width: 100%;
      height: 30px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparklineChartComponent {
  readonly values = input.required<number[]>();

  protected readonly trendPositive = computed(() => {
    const v = this.values();
    if (v.length < 2) return true;
    return v[v.length - 1] >= v[0];
  });

  protected readonly strokeColor = computed(() =>
    this.trendPositive() ? 'var(--accent)' : 'var(--danger)',
  );

  protected readonly points = computed(() => {
    const v = this.values();
    if (!v.length) return '';
    const min = Math.min(...v);
    const max = Math.max(...v);
    const range = max - min || 1;
    return v
      .map((val, i) => {
        const x = v.length === 1 ? 50 : (i / (v.length - 1)) * 100;
        const y = 28 - ((val - min) / range) * 26 + 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });
}
