import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Genre } from '../../../core/models/genre.model';
import { GenreLabelPipe } from '../../pipes/genre-label.pipe';

@Component({
  selector: 'app-genre-spotlight-card',
  standalone: true,
  imports: [RouterLink, GenreLabelPipe],
  template: `
    <a
      class="genre-card genre-link"
      [class]="toneClass()"
      [routerLink]="['/novelas/genero', genre().slug]"
    >
      <span class="genre-accent"></span>
      <div class="genre-copy">
        <strong>{{ genre() | genreLabel }}</strong>
      </div>
      <span class="genre-action">
        Explorar
        <span aria-hidden="true">→</span>
      </span>
    </a>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .genre-card {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.5rem 0.85rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }

      .genre-link {
        position: relative;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        align-content: space-between;
        transition:
          transform 160ms ease,
          border-color 160ms ease,
          background 160ms ease;
      }

      .genre-link:hover {
        transform: translateY(-2px);
        border-color: var(--border-s);
        background: color-mix(in srgb, var(--bg-card) 82%, var(--accent-glow));
      }

      .genre-tone-0 .genre-accent,
      .genre-tone-1 .genre-accent,
      .genre-tone-2 .genre-accent,
      .genre-tone-3 .genre-accent {
        background: linear-gradient(180deg, var(--accent-dim), var(--accent));
      }

      .genre-accent {
        position: absolute;
        inset: 0 auto 0 0;
        width: 0.25rem;
        border-radius: 1rem 0 0 1rem;
      }

      .genre-copy {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
      }

      .genre-card strong {
        font-size: 0.84rem;
        color: var(--text-1);
      }

      .genre-action {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        color: var(--accent-text);
        font-size: 0.75rem;
        flex-shrink: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreSpotlightCardComponent {
  readonly genre = input.required<Pick<Genre, 'slug' | 'label'>>();
  readonly toneIndex = input(0);

  toneClass(): string {
    return `genre-tone-${this.toneIndex() % 4}`;
  }
}
