import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-novel-detail-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="novel-sk">
      <div class="novel-sk__header">
        <app-skeleton variant="image" width="180px" height="260px" />
        <div class="novel-sk__info">
          <app-skeleton variant="title" width="70%" />
          <app-skeleton variant="text" width="40%" />
          <app-skeleton variant="text" width="30%" />
          <div class="novel-sk__actions">
            <app-skeleton variant="text" width="6rem" height="2.5rem" />
            <app-skeleton variant="text" width="6rem" height="2.5rem" />
          </div>
        </div>
      </div>
      <div class="novel-sk__body">
        <div class="novel-sk__chapters">
          @for (i of chapterItems; track i) {
            <app-skeleton variant="text" width="100%" height="2.5rem" />
          }
        </div>
        <div class="novel-sk__sidebar">
          <app-skeleton variant="card" height="8rem" />
          <app-skeleton variant="card" height="6rem" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .novel-sk {
      display: grid;
      gap: 1.5rem;
    }

    .novel-sk__header {
      display: flex;
      gap: 1.5rem;
    }

    .novel-sk__info {
      display: grid;
      gap: 0.5rem;
      align-content: start;
      flex: 1;
    }

    .novel-sk__actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .novel-sk__body {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 1.5rem;
    }

    .novel-sk__chapters {
      display: grid;
      gap: 0.5rem;
    }

    .novel-sk__sidebar {
      display: grid;
      gap: 1rem;
      align-content: start;
    }

    @media (max-width: 767px) {
      .novel-sk__header {
        flex-direction: column;
        align-items: center;
      }
      .novel-sk__body {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovelDetailSkeletonComponent {
  chapterItems = [1, 2, 3, 4, 5];
}
