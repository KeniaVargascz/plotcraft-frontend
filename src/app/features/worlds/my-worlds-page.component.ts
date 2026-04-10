import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WorldSummary } from '../../core/models/world.model';
import { WorldsService } from '../../core/services/worlds.service';
import { WorldCardComponent } from './components/world-card.component';

@Component({
  selector: 'app-my-worlds-page',
  standalone: true,
  imports: [RouterLink, WorldCardComponent],
  template: `
    <section class="my-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Autor</p>
          <h1>Mis mundos</h1>
          <p class="lede">Gestiona universos, ubicaciones y su visibilidad publica.</p>
        </div>
        <a class="cta" routerLink="/mis-mundos/nuevo">Nuevo mundo</a>
      </header>

      @if (loading()) {
        <p class="state">Cargando mundos...</p>
      } @else if (!worlds().length) {
        <section class="card empty">
          <h2>Aun no has creado mundos</h2>
          <p>Empieza con una ambientacion base y luego agrega lugares y novelas vinculadas.</p>
        </section>
      } @else {
        <section class="grid">
          @for (world of worlds(); track world.id) {
            <article class="stack">
              <app-world-card [world]="world" [showVisibility]="true" />
              @if (world.wbSummary && world.wbSummary.entriesCount) {
                <div class="wb-badge-row">
                  <span class="wb-badge"
                    >&#128218; {{ world.wbSummary!.entriesCount }} entradas</span
                  >
                </div>
              }
              <div class="actions">
                <a [routerLink]="['/mis-mundos', world.slug, 'editar']">Editar</a>
                <button
                  type="button"
                  [disabled]="removing() === world.slug"
                  (click)="remove(world.slug)"
                >
                  {{ removing() === world.slug ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </article>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .my-shell,
      .stack {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.25rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .hero,
      .actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: center;
      }
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .cta,
      .actions a,
      .actions button {
        padding: 0.8rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        text-decoration: none;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .eyebrow,
      .lede,
      .state,
      .empty p {
        color: var(--text-2);
      }
      .wb-badge-row {
        display: flex;
        justify-content: center;
      }
      .wb-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.7rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.72rem;
        font-weight: 600;
      }
      @media (max-width: 960px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MyWorldsPageComponent {
  private readonly worldsService = inject(WorldsService);

  readonly worlds = signal<WorldSummary[]>([]);
  readonly loading = signal(true);
  readonly removing = signal<string | null>(null);

  constructor() {
    this.load();
  }

  remove(slug: string) {
    if (this.removing()) return;
    this.removing.set(slug);
    this.worldsService
      .remove(slug)
      .pipe(finalize(() => this.removing.set(null)))
      .subscribe({
        next: () => this.load(),
      });
  }

  private load() {
    this.loading.set(true);
    this.worldsService
      .listMine({ limit: 40, sort: 'updated' })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.worlds.set(response.data),
        error: () => this.worlds.set([]),
      });
  }
}
