import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
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
  imports: [
    FormsModule,
    ErrorMessageComponent,
    LoadingSpinnerComponent,
    SeriesCardComponent,
    PaginatorComponent,
  ],
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
          @if (totalPages() > 1) {
            <app-paginator
              [currentPage]="currentPage()"
              [totalPages]="totalPages()"
              (pageChange)="goToPage($event)"
            />
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
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

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
    this.currentPage.set(1);
    this.fetchPage();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.fetchPage();
  }

  private fetchPage(): void {
    this.loading.set(true);
    this.error.set(false);
    this.seriesService
      .list({
        page: this.currentPage(),
        limit: 12,
        search: this.search || null,
        type: this.type,
        status: this.status,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data);
          this.totalPages.set(res.pagination.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
