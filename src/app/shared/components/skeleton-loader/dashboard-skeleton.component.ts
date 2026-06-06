import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-dashboard-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="dash-sk">
      <div class="dash-sk__metrics">
        @for (i of [0, 1, 2, 3]; track i) {
          <div class="dash-sk__metric">
            <app-skeleton variant="text" width="50%" />
            <app-skeleton variant="title" width="40%" />
          </div>
        }
      </div>
      <app-skeleton variant="card" height="14rem" />
      <div class="dash-sk__row">
        <app-skeleton variant="card" height="10rem" />
        <app-skeleton variant="card" height="10rem" />
      </div>
    </div>
  `,
  styles: `
    .dash-sk {
      display: grid;
      gap: 1.5rem;
    }

    .dash-sk__metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .dash-sk__metric {
      display: grid;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
    }

    .dash-sk__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 767px) {
      .dash-sk__metrics {
        grid-template-columns: repeat(2, 1fr);
      }
      .dash-sk__row {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSkeletonComponent {}
