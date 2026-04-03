import { Component, input, output } from '@angular/core';
import { WbEntrySummary } from '../../../../core/models/wb-entry.model';
import { WbEntryCardComponent } from './wb-entry-card.component';

@Component({
  selector: 'app-wb-entry-grid',
  standalone: true,
  imports: [WbEntryCardComponent],
  template: `
    @if (entries().length) {
      <div class="grid">
        @for (entry of entries(); track entry.id) {
          <app-wb-entry-card
            [entry]="entry"
            [showActions]="showActions()"
            (select)="entrySelected.emit($event)"
            (edit)="entryEdit.emit($event)"
            (delete)="entryDelete.emit($event)"
          />
        }
      </div>
    } @else {
      <div class="empty">
        <p>No hay entradas en esta categoria.</p>
      </div>
    }
  `,
  styles: [`
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    }
    .empty {
      padding: 2rem;
      text-align: center;
      color: var(--text-3);
    }
  `],
})
export class WbEntryGridComponent {
  readonly entries = input.required<WbEntrySummary[]>();
  readonly showActions = input(false);

  readonly entrySelected = output<WbEntrySummary>();
  readonly entryEdit = output<WbEntrySummary>();
  readonly entryDelete = output<WbEntrySummary>();
}
