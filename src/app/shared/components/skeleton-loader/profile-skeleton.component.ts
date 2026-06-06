import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-profile-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="profile-sk">
      <div class="profile-sk__header">
        <app-skeleton variant="circle" width="5rem" height="5rem" />
        <div class="profile-sk__info">
          <app-skeleton variant="title" width="40%" />
          <app-skeleton variant="text" width="25%" />
          <app-skeleton variant="text" width="60%" />
        </div>
      </div>
      <div class="profile-sk__stats">
        @for (i of [0, 1, 2, 3]; track i) {
          <app-skeleton variant="card" height="4rem" />
        }
      </div>
      <div class="profile-sk__content">
        @for (i of [0, 1, 2]; track i) {
          <app-skeleton variant="card" height="8rem" />
        }
      </div>
    </div>
  `,
  styles: `
    .profile-sk {
      display: grid;
      gap: 1.5rem;
    }

    .profile-sk__header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .profile-sk__info {
      display: grid;
      gap: 0.5rem;
      flex: 1;
    }

    .profile-sk__stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .profile-sk__content {
      display: grid;
      gap: 1rem;
    }

    @media (max-width: 767px) {
      .profile-sk__stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSkeletonComponent {}
