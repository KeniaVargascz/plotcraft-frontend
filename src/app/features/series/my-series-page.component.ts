import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SeriesCardComponent } from './components/series-card/series-card.component';
import { SeriesSummary } from './models/series.model';
import { SeriesService } from './services/series.service';

@Component({
  selector: 'app-my-series-page',
  standalone: true,
  imports: [RouterLink, ErrorMessageComponent, LoadingSpinnerComponent, SeriesCardComponent],
  template: `
    <section class="page">
      <header class="header">
        <div>
          <h1>Mis sagas y series</h1>
          <p>Gestiona las colecciones de tus novelas.</p>
        </div>
        <a class="primary" routerLink="/mis-sagas/nueva">Nueva saga</a>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <app-error-message />
      } @else if (!items().length) {
        <p class="empty">Aún no has creado ninguna saga.</p>
      } @else {
        <div class="grid">
          @for (s of items(); track s.id) {
            <div class="item">
              <app-series-card [series]="s" />
              <div class="actions">
                <a [routerLink]="['/mis-sagas', s.slug, 'editar']">Editar</a>
                <button type="button" (click)="remove(s)">Eliminar</button>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .primary {
        padding: 0.75rem 1.25rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        text-decoration: none;
        font-weight: 600;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      .item {
        display: grid;
        gap: 0.5rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .actions a,
      .actions button {
        padding: 0.45rem 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
        cursor: pointer;
        font-size: 0.82rem;
      }
      .empty {
        color: var(--text-2);
        text-align: center;
      }
      @media (max-width: 800px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MySeriesPageComponent implements OnInit {
  private readonly seriesService = inject(SeriesService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly items = signal<SeriesSummary[]>([]);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const username = this.authService.getCurrentUserSnapshot()?.username;
    if (!username) {
      this.loading.set(false);
      return;
    }
    this.seriesService.list({ authorUsername: username, limit: 50 }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  remove(series: SeriesSummary): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar saga',
        description: `¿Seguro que deseas eliminar "${series.title}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok !== true) return;
      this.seriesService.delete(series.slug).subscribe({
        next: () => this.items.update((list) => list.filter((s) => s.id !== series.id)),
      });
    });
  }
}
