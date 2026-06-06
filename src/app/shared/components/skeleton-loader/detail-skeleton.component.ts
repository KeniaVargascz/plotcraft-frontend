import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-detail-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="detail-sk">
      <div class="detail-sk__hero">
        <app-skeleton variant="image" width="100%" height="10rem" />
        <div class="detail-sk__info">
          <app-skeleton variant="title" width="50%" />
          <app-skeleton variant="text" width="35%" />
          <app-skeleton variant="text" width="25%" />
          <div class="detail-sk__badges">
            <app-skeleton variant="text" width="5rem" height="1.5rem" />
            <app-skeleton variant="text" width="5rem" height="1.5rem" />
          </div>
        </div>
      </div>
      <div class="detail-sk__body">
        <div class="detail-sk__main">
          <app-skeleton variant="text" width="100%" />
          <app-skeleton variant="text" width="95%" />
          <app-skeleton variant="text" width="80%" />
          <app-skeleton variant="text" width="90%" />
          <app-skeleton variant="text" width="60%" />
        </div>
        <div class="detail-sk__sidebar">
          <app-skeleton variant="card" height="6rem" />
          <app-skeleton variant="card" height="5rem" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .detail-sk {
      display: grid;
      gap: 1.5rem;
    }

    .detail-sk__hero {
      display: grid;
      gap: 1rem;
    }

    .detail-sk__info {
      display: grid;
      gap: 0.5rem;
    }

    .detail-sk__badges {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .detail-sk__body {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 1.5rem;
    }

    .detail-sk__main {
      display: grid;
      gap: 0.5rem;
    }

    .detail-sk__sidebar {
      display: grid;
      gap: 1rem;
      align-content: start;
    }

    @media (max-width: 767px) {
      .detail-sk__body {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailSkeletonComponent {}
