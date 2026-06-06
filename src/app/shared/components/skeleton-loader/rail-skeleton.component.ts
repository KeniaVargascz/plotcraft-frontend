import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-rail-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="rail-sk">
      @for (i of itemsArray; track i) {
        <div class="rail-sk__card">
          <app-skeleton variant="image" height="14rem" />
          <div class="rail-sk__info">
            <app-skeleton variant="text" width="80%" />
            <app-skeleton variant="text" width="55%" />
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .rail-sk {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(280px, 360px);
      gap: 1rem;
      overflow-x: hidden;
    }

    .rail-sk__card {
      display: grid;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
    }

    .rail-sk__info {
      display: grid;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RailSkeletonComponent {
  count = input(4);

  get itemsArray() {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
