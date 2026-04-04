import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-period-selector',
  standalone: true,
  template: `
    <div class="chips">
      @for (p of periods; track p.value) {
        <button
          type="button"
          class="chip"
          [class.active]="selected() === p.value"
          (click)="periodChange.emit(p.value)"
        >
          {{ p.label }}
        </button>
      }
    </div>
  `,
  styles: `
    .chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip {
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-2);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chip:hover {
      border-color: var(--accent);
      color: var(--text-1);
    }
    .chip.active {
      background: var(--accent);
      color: var(--accent-text);
      border-color: var(--accent);
      box-shadow: 0 0 8px var(--accent-glow);
    }
  `,
})
export class PeriodSelectorComponent {
  readonly selected = input<string>('30d');
  readonly periodChange = output<string>();

  readonly periods = [
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: '90d', label: '90d' },
    { value: '1y', label: '1y' },
    { value: 'all', label: 'Todo' },
  ];
}
