import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

@Component({
  selector: 'app-kanban-skeleton',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="kanban-sk">
      @for (col of [1, 2, 3]; track col) {
        <div class="kanban-sk__col">
          <app-skeleton variant="title" width="60%" />
          @for (card of [1, 2, 3]; track card) {
            <app-skeleton variant="card" width="100%" height="5.5rem" />
          }
        </div>
      }
    </div>
  `,
  styles: `
    .kanban-sk {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      height: 80vh;
      align-items: flex-start;
    }

    .kanban-sk__col {
      flex: 1;
      display: grid;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanSkeletonComponent {}
