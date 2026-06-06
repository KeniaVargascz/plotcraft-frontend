import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-card-grid-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="grid-sk" [style.--sk-min-width]="minWidth()">
      @for (i of itemsArray; track i) {
        <div class="grid-sk__card">
          <app-skeleton variant="image" />
          <div class="grid-sk__info">
            <app-skeleton variant="text" width="75%" />
            <app-skeleton variant="text" width="50%" />
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .grid-sk {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--sk-min-width, 280px), 1fr));
      gap: 1rem;
    }

    .grid-sk__card {
      display: grid;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
    }

    .grid-sk__info {
      display: grid;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGridSkeletonComponent {
  count = input(6);
  minWidth = input('280px');

  get itemsArray() {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
