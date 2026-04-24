import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-delta-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="badgeClass()">
      <span class="arrow">{{ arrow() }}</span>
      <span class="value">{{ absDelta() }}</span>
      <span class="pct">({{ absPct() }}%)</span>
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .positive {
      color: #22c55e;
      background: rgba(34, 197, 94, 0.12);
    }
    .negative {
      color: var(--danger);
      background: rgba(239, 68, 68, 0.12);
    }
    .neutral {
      color: var(--text-3);
      background: var(--bg-surface);
    }
    .arrow {
      font-size: 0.75rem;
    }
    .pct {
      opacity: 0.8;
      font-size: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeltaBadgeComponent {
  readonly delta = input.required<number>();
  readonly pct = input.required<number>();

  protected readonly badgeClass = computed(() => {
    const d = this.delta();
    return d > 0 ? 'positive' : d < 0 ? 'negative' : 'neutral';
  });

  protected readonly arrow = computed(() => {
    const d = this.delta();
    return d > 0 ? '\u2191' : d < 0 ? '\u2193' : '=';
  });

  protected readonly absDelta = computed(() => Math.abs(this.delta()));
  protected readonly absPct = computed(() => Math.abs(this.pct()));
}
