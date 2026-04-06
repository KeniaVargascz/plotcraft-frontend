import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-word-progress-bar',
  standalone: true,
  template: `
    <div class="progress-wrapper">
      <div class="progress-track">
        <div
          class="progress-fill"
          [style.width.%]="clampedPct()"
          [style.background]="barColor()"
        ></div>
      </div>
      <span class="progress-label" [style.color]="barColor()">
        {{ label() }}
      </span>
    </div>
  `,
  styles: [
    `
      .progress-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
      }
      .progress-track {
        height: 6px;
        border-radius: 3px;
        background: var(--border);
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
      }
      .progress-label {
        font-size: 0.75rem;
        font-weight: 500;
      }
    `,
  ],
})
export class WordProgressBarComponent {
  actual = input.required<number>();
  target = input.required<number>();

  percentage = computed(() => {
    const t = this.target();
    if (t <= 0) return 0;
    return Math.round((this.actual() / t) * 100);
  });

  clampedPct = computed(() => Math.min(this.percentage(), 100));

  barColor = computed(() => {
    const pct = this.percentage();
    const t = this.target();
    if (this.actual() >= t && t > 0) return '#22c55e';
    if (pct > 80) return 'var(--accent)';
    return 'var(--text-3)';
  });

  label = computed(() => {
    const a = this.actual();
    const t = this.target();
    const pct = this.percentage();
    if (a >= t && t > 0)
      return `Meta alcanzada (${a.toLocaleString()} / ${t.toLocaleString()} palabras)`;
    return `${a.toLocaleString()} / ${t.toLocaleString()} palabras (${pct}%)`;
  });
}
