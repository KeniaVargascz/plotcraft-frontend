import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { WorldSummary } from '../../core/models/world.model';
import { WorldsService } from '../../core/services/worlds.service';
import { WorldCardComponent } from './components/world-card.component';

@Component({
  selector: 'app-worlds-catalog-page',
  standalone: true,
  imports: [FormsModule, WorldCardComponent],
  template: `
    <section class="catalog-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Atlas narrativo</p>
          <h1>Mundos</h1>
          <p class="lede">
            Descubre universos, sistemas de magia, geografias y reglas construidas por la comunidad.
          </p>
        </div>
        <label class="search">
          <span>Buscar</span>
          <input
            [(ngModel)]="search"
            (ngModelChange)="load()"
            placeholder="Busca por nombre o concepto"
          />
        </label>
      </header>

      @if (loading()) {
        <p class="state">Cargando mundos...</p>
      } @else if (!worlds().length) {
        <p class="state">Aun no hay mundos publicados para mostrar.</p>
      } @else {
        <section class="grid">
          @for (world of worlds(); track world.id) {
            <app-world-card [world]="world" />
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .catalog-shell,
      .hero {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.35rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .hero {
        grid-template-columns: 1.2fr 0.8fr;
        align-items: end;
      }
      .eyebrow,
      .lede,
      .search span,
      .state {
        color: var(--text-2);
      }
      .search {
        display: grid;
        gap: 0.5rem;
      }
      input {
        padding: 0.9rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      @media (max-width: 1000px) {
        .hero,
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WorldsCatalogPageComponent {
  private readonly worldsService = inject(WorldsService);

  readonly worlds = signal<WorldSummary[]>([]);
  readonly loading = signal(true);
  search = '';

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.worldsService
      .listPublic({ limit: 24, search: this.search || null, sort: 'updated' })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.worlds.set(response.data),
        error: () => this.worlds.set([]),
      });
  }
}
