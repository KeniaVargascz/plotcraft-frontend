import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { CardGridSkeletonComponent } from '../../shared/components/skeleton-loader/card-grid-skeleton.component';
import { SeriesCardComponent } from './components/series-card/series-card.component';
import { SeriesSummary } from './models/series.model';
import { SeriesService } from './services/series.service';

@Component({
  selector: 'app-my-series-page',
  standalone: true,
  imports: [RouterLink, ErrorMessageComponent, CardGridSkeletonComponent, SeriesCardComponent],
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
        <app-card-grid-skeleton />
      } @else if (error()) {
        <app-error-message />
      } @else if (!items().length) {
        <p class="empty">Aún no has creado ninguna saga.</p>
      } @else {
        <div class="grid">
          @for (s of items(); track s.id) {
            <app-series-card
              [series]="s"
              [showActions]="true"
              (edit)="onEdit(s.slug)"
              (delete)="remove(s)"
            />
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.5rem;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .primary {
        padding: 0.75rem 1.5rem;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MySeriesPageComponent implements OnInit {
  private readonly seriesService = inject(SeriesService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

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
    this.seriesService
      .list({ authorUsername: username, limit: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  onEdit(slug: string): void {
    this.router.navigate(['/mis-sagas', slug, 'editar']);
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
