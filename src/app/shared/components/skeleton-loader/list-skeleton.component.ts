import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-list-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="list-sk">
      @for (i of itemsArray; track i) {
        <div class="list-sk__item">
          <app-skeleton variant="avatar" />
          <div class="list-sk__text">
            <app-skeleton variant="text" width="60%" />
            <app-skeleton variant="text" width="40%" />
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .list-sk {
      display: grid;
      gap: 0.75rem;
    }

    .list-sk__item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
    }

    .list-sk__text {
      display: grid;
      gap: 0.5rem;
      flex: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListSkeletonComponent {
  count = input(6);

  get itemsArray() {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
