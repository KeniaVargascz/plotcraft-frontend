import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-timeline-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="tl-sk">
      <app-skeleton variant="text" width="100%" height="2.5rem" />
      <div class="tl-sk__list">
        @for (item of [1, 2, 3, 4, 5]; track item) {
          <div class="tl-sk__row">
            <app-skeleton variant="text" width="5rem" height="1rem" />
            <app-skeleton variant="card" width="100%" height="4rem" />
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .tl-sk {
      display: grid;
      gap: 1rem;
      padding: 1rem;
      min-height: 100vh;
    }

    .tl-sk__list {
      display: grid;
      gap: 0.75rem;
    }

    .tl-sk__row {
      display: grid;
      grid-template-columns: 5rem 1fr;
      gap: 1rem;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineSkeletonComponent {}
