import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Genre } from '../../core/models/genre.model';
import { GenresService } from '../../core/services/genres.service';

@Component({
  selector: 'app-genres-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="genres-page">
      <header class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Generos</p>
          <h1>Explora todos los generos</h1>
          <p>Encuentra todas las novelas publicas agrupadas por genero.</p>
        </div>
        <a class="hero-link" [routerLink]="['/novelas']">Ver catalogo general</a>
      </header>

      @if (loading()) {
        <div class="state-card">Cargando generos...</div>
      } @else if (!genres().length) {
        <div class="state-card">Aun no hay generos disponibles.</div>
      } @else {
        <div class="genres-grid">
          @for (genre of genres(); track genre.id; let index = $index) {
            <a
              class="genre-card"
              [class]="toneClass(index)"
              [routerLink]="['/novelas/genero', genre.slug]"
            >
              <span class="genre-accent"></span>
              <div class="genre-copy">
                <strong>{{ genre.label }}</strong>
                <span>Ir al listado completo de novelas en este genero</span>
              </div>
              <span class="genre-action">
                Explorar
                <span aria-hidden="true">↗</span>
              </span>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .genres-page {
        display: grid;
        gap: 1.25rem;
      }

      .hero,
      .state-card,
      .genre-card {
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }

      .hero {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.35rem;
        align-items: end;
      }

      .hero-copy {
        display: grid;
        gap: 0.35rem;
      }

      .hero-copy h1,
      .hero-copy p {
        margin: 0;
      }

      .eyebrow {
        color: var(--text-3);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.72rem;
        font-weight: 700;
      }

      .hero-link {
        text-decoration: none;
        color: var(--accent-text);
        font-weight: 600;
      }

      .state-card {
        padding: 1.2rem;
      }

      .genres-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }

      .genre-card {
        position: relative;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        min-height: 10rem;
        padding: 1.2rem;
        display: grid;
        align-content: space-between;
        gap: 1rem;
        transition:
          transform 160ms ease,
          border-color 160ms ease,
          background 160ms ease;
      }

      .genre-card:hover {
        transform: translateY(-2px);
        border-color: var(--border-s);
        background: color-mix(in srgb, var(--bg-card) 82%, var(--accent-glow));
      }

      .genre-accent {
        position: absolute;
        inset: 0 auto 0 0;
        width: 0.35rem;
        border-radius: 1.25rem 0 0 1.25rem;
      }

      .tone-0 .genre-accent {
        background: linear-gradient(180deg, #6b7cff, #8ea6ff);
      }

      .tone-1 .genre-accent {
        background: linear-gradient(180deg, #4f9d76, #79c89e);
      }

      .tone-2 .genre-accent {
        background: linear-gradient(180deg, #8e5bbd, #b98cdf);
      }

      .tone-3 .genre-accent {
        background: linear-gradient(180deg, #bc7f5a, #dfaf7f);
      }

      .genre-copy {
        display: grid;
        gap: 0.45rem;
        padding-left: 0.2rem;
      }

      .genre-copy strong {
        color: var(--text-1);
        font-size: 1.05rem;
      }

      .genre-copy span {
        color: var(--text-2);
        line-height: 1.5;
      }

      .genre-action {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--accent-text);
        font-weight: 600;
      }

      @media (max-width: 760px) {
        .hero {
          flex-direction: column;
          align-items: start;
        }
      }
    `,
  ],
})
export class GenresPageComponent {
  private readonly genresService = inject(GenresService);

  readonly loading = signal(true);
  readonly genres = signal<Genre[]>([]);

  constructor() {
    this.genresService.list().subscribe({
      next: (genres) => {
        this.genres.set(genres);
        this.loading.set(false);
      },
      error: () => {
        this.genres.set([]);
        this.loading.set(false);
      },
    });
  }

  toneClass(index: number) {
    return `tone-${index % 4}`;
  }
}
