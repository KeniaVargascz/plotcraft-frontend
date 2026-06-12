import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      class="skeleton-bone"
      [class.skeleton--circle]="variant() === 'circle'"
      [class.skeleton--text]="variant() === 'text'"
      [class.skeleton--title]="variant() === 'title'"
      [class.skeleton--card]="variant() === 'card'"
      [class.skeleton--avatar]="variant() === 'avatar'"
      [class.skeleton--image]="variant() === 'image'"
      [style.width]="width()"
      [style.height]="height()"
    ></div>
  `,
  styles: `
    :host {
      display: block;
    }

    .skeleton-bone {
      background: linear-gradient(
        90deg,
        var(--bg-elevated) 25%,
        color-mix(in srgb, var(--bg-elevated) 60%, var(--accent-glow, transparent)) 50%,
        var(--bg-elevated) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 0.5rem;
    }

    .skeleton--text {
      height: 0.875rem;
      border-radius: 0.25rem;
    }

    .skeleton--title {
      height: 1.5rem;
      width: 60%;
      border-radius: 0.25rem;
    }

    .skeleton--circle {
      border-radius: 50%;
    }

    .skeleton--avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
    }

    .skeleton--card {
      height: 12rem;
      border-radius: 1rem;
    }

    .skeleton--image {
      height: 10rem;
      border-radius: 1rem;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonLoaderComponent {
  variant = input<'text' | 'title' | 'circle' | 'card' | 'avatar' | 'image'>('text');
  width = input<string | undefined>(undefined);
  height = input<string | undefined>(undefined);
}
