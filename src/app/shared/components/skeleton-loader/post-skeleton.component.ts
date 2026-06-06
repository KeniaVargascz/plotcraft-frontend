import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-post-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    @for (i of items; track i) {
      <div class="post-sk">
        <div class="post-sk__header">
          <app-skeleton variant="avatar" />
          <div class="post-sk__meta">
            <app-skeleton variant="text" width="40%" />
            <app-skeleton variant="text" width="25%" />
          </div>
        </div>
        <div class="post-sk__body">
          <app-skeleton variant="text" width="100%" />
          <app-skeleton variant="text" width="90%" />
          <app-skeleton variant="text" width="70%" />
        </div>
        <div class="post-sk__footer">
          <app-skeleton variant="text" width="5rem" height="1.5rem" />
          <app-skeleton variant="text" width="5rem" height="1.5rem" />
          <app-skeleton variant="text" width="5rem" height="1.5rem" />
        </div>
      </div>
    }
  `,
  styles: `
    :host { display: grid; gap: 1rem; }

    .post-sk {
      display: grid;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 1.5rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
    }

    .post-sk__header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .post-sk__meta {
      display: grid;
      gap: 0.5rem;
      flex: 1;
    }

    .post-sk__body {
      display: grid;
      gap: 0.5rem;
    }

    .post-sk__footer {
      display: flex;
      gap: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostSkeletonComponent {
  items = [1, 2, 3];
}
