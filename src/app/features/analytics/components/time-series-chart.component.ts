import {
  ChangeDetectionStrategy,
  Component,
  input,
  effect,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
);

@Component({
  selector: 'app-time-series-chart',
  standalone: true,
  template: `
    <div class="chart-wrap">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: `
    .chart-wrap {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      position: relative;
      height: 300px;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeSeriesChartComponent implements AfterViewInit, OnDestroy {
  readonly labels = input.required<string[]>();
  readonly values = input.required<number[]>();
  readonly label = input<string>('');

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private observer: MutationObserver | null = null;

  constructor() {
    effect(() => {
      const l = this.labels();
      const v = this.values();
      const lbl = this.label();
      if (this.canvasRef) {
        this.createChart(l, v, lbl);
      }
    });
  }

  ngAfterViewInit(): void {
    this.createChart(this.labels(), this.values(), this.label());

    const html = document.documentElement;
    this.observer = new MutationObserver(() => {
      this.createChart(this.labels(), this.values(), this.label());
    });
    this.observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.observer?.disconnect();
  }

  private readCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private createChart(labels: string[], values: number[], label: string): void {
    this.chart?.destroy();

    const accent = this.readCssVar('--accent') || '#6366f1';
    const border = this.readCssVar('--border') || '#333';
    const text2 = this.readCssVar('--text-2') || '#999';
    const accentGlow = this.readCssVar('--accent-glow') || accent;

    const ctx = this.canvasRef.nativeElement.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, accent + '40');
    gradient.addColorStop(1, accent + '00');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            borderColor: accent,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: accent,
            pointHoverBorderColor: accentGlow,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 8,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { color: border + '40' },
            ticks: { color: text2, maxTicksLimit: 8, font: { size: 11 } },
            border: { display: false },
          },
          y: {
            grid: { color: border + '40' },
            ticks: { color: text2, font: { size: 11 } },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
  }
}
