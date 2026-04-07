import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SeriesCardComponent } from './components/series-card/series-card.component';
import {
  SERIES_STATUS_LABELS,
  SERIES_TYPE_LABELS,
  SeriesStatus,
  SeriesSummary,
  SeriesType,
} from './models/series.model';
import { SeriesService } from './services/series.service';

@Component({
  selector: 'app-series-catalog-page',
  standalone: true,
  imports: [FormsModule, ErrorMessageComponent, LoadingSpinnerComponent, SeriesCardComponent],
  template: `
    <section class="page">
      <header class="header">
        <h1>Sagas y Series</h1>
        <p>Colecciones de novelas agrupadas por universo.</p>
      </header>

      <div class="filters">
        <input
          type="search"
          placeholder="Buscar sagas..."
          [(ngModel)]="search"
          (ngModelChange)="onSearchChange($event)"
        />
        <select [(ngModel)]="type" (ngModelChange)="reload()">
          <option [ngValue]="null">Todos los tipos</option>
          @for (t of typeKeys; track t) {
            <option [ngValue]="t">{{ typeLabels[t] }}</option>
          }
        </select>
        <select [(ngModel)]="status" (ngModelChange)="reload()">
          <option [ngValue]="null">Todos los estados</option>
          @for (s of statusKeys; track s) {
            <option [ngValue]="s">{{ statusLabels[s] }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <app-error-message />
      } @else {
        @if (!items().length) {
          <p class="empty">Aún no hay sagas publicadas.</p>
        } @else {
          <div class="grid">
            @for (s of items(); track s.id) {
              <app-series-card [series]="s" />
            }
          </div>
          @if (hasMore()) {
            <button type="button" class="load-more" (click)="loadMore()">Cargar más</button>
          }
        }
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
      }
      .header h1 {
        margin: 0 0 0.25rem;
      }
      .header p {
        margin: 0;
        color: var(--text-2);
      }
      .filters {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0.75rem;
      }
      .filters input,
      .filters select {
        padding: 0.7rem 0.9rem;
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      .load-more {
        margin: 1rem auto 0;
        padding: 0.75rem 1.5rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
      }
      .empty {
        text-align: center;
        color: var(--text-2);
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .filters {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SeriesCatalogPageComponent implements OnInit {
  private readonly seriesService = inject(SeriesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly items = signal<SeriesSummary[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);

  readonly typeLabels = SERIES_TYPE_LABELS;
  readonly statusLabels = SERIES_STATUS_LABELS;
  readonly typeKeys = Object.keys(SERIES_TYPE_LABELS) as SeriesType[];
  readonly statusKeys = Object.keys(SERIES_STATUS_LABELS) as SeriesStatus[];

  search = '';
  type: SeriesType | null = null;
  status: SeriesStatus | null = null;

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
    this.reload();
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.searchSubject.next(value);
  }

  reload(): void {
    this.load(true);
  }

  loadMore(): void {
    this.load(false);
  }

  private load(reset: boolean): void {
    this.loading.set(reset);
    this.error.set(false);
    this.seriesService
      .list({
        cursor: reset ? null : this.nextCursor(),
        search: this.search || null,
        type: this.type,
        status: this.status,
      })
      .subscribe({
        next: (res) => {
          this.items.set(reset ? res.data : [...this.items(), ...res.data]);
          this.nextCursor.set(res.pagination.nextCursor);
          this.hasMore.set(res.pagination.hasMore);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
