import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NovelSummary } from '../../core/models/novel.model';
import { NovelsService } from '../../core/services/novels.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { NovelCardComponent } from './components/novel-card.component';

@Component({
  selector: 'app-my-novels-page',
  standalone: true,
  imports: [RouterLink, ErrorMessageComponent, LoadingSpinnerComponent, NovelCardComponent],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <h1>Mis novelas</h1>
          <p>Gestiona borradores, obras publicadas y seriales en progreso.</p>
        </div>

        <div class="header-actions">
          <a class="secondary" routerLink="/mis-mundos">Mis mundos</a>
          <a class="secondary" routerLink="/mis-personajes">Mis personajes</a>
          <a class="primary" routerLink="/mis-novelas/nueva">Nueva novela</a>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <app-error-message />
      } @else {
        <div class="grid">
          @for (novel of novels(); track novel.id) {
            <app-novel-card [novel]="novel" />
          }
        </div>

        @if (!novels().length) {
          <div class="empty">Aun no tienes novelas. Empieza a escribir tu primera historia.</div>
        }
      }
    </section>
  `,
  styles: [
    `
      .page-shell,
      .grid {
        display: grid;
        gap: 1rem;
      }
      .page-header,
      .header-actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .primary {
        padding: 0.85rem 1rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        text-decoration: none;
      }
      .secondary {
        padding: 0.85rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        color: var(--text-1);
        text-decoration: none;
      }
    `,
  ],
})
export class MyNovelsPageComponent implements OnInit {
  private readonly novelsService = inject(NovelsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly novels = signal<NovelSummary[]>([]);

  ngOnInit() {
    this.novelsService.listMine({ limit: 50 }).subscribe({
      next: (response) => {
        this.novels.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
