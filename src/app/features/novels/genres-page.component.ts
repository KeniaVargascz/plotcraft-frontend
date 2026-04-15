import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Genre } from '../../core/models/genre.model';
import { GenresService } from '../../core/services/genres.service';
import { GenreSpotlightCardComponent } from '../../shared/components/genre-spotlight-card/genre-spotlight-card.component';

@Component({
  selector: 'app-genres-page',
  standalone: true,
  imports: [RouterLink, GenreSpotlightCardComponent],
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
            <app-genre-spotlight-card [genre]="genre" [toneIndex]="index" />
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
      .state-card {
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
}
