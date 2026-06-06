import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="empty-state">
      <span class="empty-state__icon">{{ icon() }}</span>
      <h3 class="empty-state__title">{{ title() }}</h3>
      @if (subtitle()) {
        <p class="empty-state__subtitle">{{ subtitle() }}</p>
      }
      @if (ctaLabel() && ctaRoute()) {
        <a class="empty-state__cta" [routerLink]="ctaRoute()">{{ ctaLabel() }}</a>
      }
    </div>
  `,
  styles: `
    .empty-state {
      display: grid;
      place-items: center;
      gap: 0.5rem;
      padding: 2rem 1.5rem;
      text-align: center;
      border: 1px dashed var(--border-s);
      border-radius: 1rem;
      background: var(--bg-surface);
    }

    .empty-state__icon {
      font-size: 2.5rem;
      line-height: 1;
      opacity: 0.7;
    }

    .empty-state__title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-1);
      margin: 0;
    }

    .empty-state__subtitle {
      font-size: 0.875rem;
      color: var(--text-2);
      margin: 0;
      max-width: 28rem;
    }

    .empty-state__cta {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.5rem 1.5rem;
      border-radius: 0.5rem;
      background: var(--accent);
      color: var(--accent-contrast);
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .empty-state__cta:hover {
      opacity: 0.85;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  icon = input('📭');
  title = input.required<string>();
  subtitle = input<string | undefined>(undefined);
  ctaLabel = input<string | undefined>(undefined);
  ctaRoute = input<string | undefined>(undefined);
}
