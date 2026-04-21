import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Genre } from '../../../../core/models/genre.model';
import { GenreLabelPipe } from '../../../../shared/pipes/genre-label.pipe';

@Component({
  selector: 'app-novel-form-genre-selector',
  standalone: true,
  imports: [FormsModule, GenreLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="full genres">
      <legend>Generos</legend>
      <div class="genre-picker">
        <select
          [disabled]="disabled || selectedGenreIds.length >= maxGenres || !availableGenres.length"
          [ngModel]="''"
          (ngModelChange)="onAdd($event)"
        >
          <option value="" disabled>
            @if (selectedGenreIds.length >= maxGenres) {
              Maximo {{ maxGenres }} generos
            } @else if (!availableGenres.length) {
              No quedan generos por agregar
            } @else {
              Selecciona un genero...
            }
          </option>
          @for (genre of availableGenres; track genre.id) {
            <option [value]="genre.id">{{ genre | genreLabel }}</option>
          }
        </select>
        @if (selectedGenres.length) {
          <ul class="picked-list">
            @for (genre of selectedGenres; track genre.id) {
              <li>
                {{ genre | genreLabel }}
                <button
                  type="button"
                  class="icon"
                  [disabled]="disabled"
                  aria-label="Quitar genero"
                  (click)="onRemove(genre.id)"
                >
                  ✕
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="hint">Puedes elegir hasta {{ maxGenres }} generos.</p>
        }
      </div>
    </fieldset>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .full {
        grid-column: 1 / -1;
      }
      .genres {
        display: grid;
        gap: 0.5rem;
      }
      fieldset {
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        padding: 0.85rem;
      }
      legend {
        color: var(--text-2);
        font-size: 0.88rem;
        font-weight: 600;
        padding: 0 0.35rem;
      }
      select {
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.75rem 0.9rem;
        width: 100%;
      }
      select:focus {
        outline: none;
        border-color: var(--accent);
      }
      .genre-picker {
        display: flex;
        flex-direction: column-reverse;
        gap: 0.5rem;
      }
      .genre-picker .hint {
        order: -1;
      }
      .hint {
        margin: 0;
        color: var(--text-2);
      }
      .picked-list {
        list-style: none;
        margin: 0.5rem 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .picked-list li {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        background: var(--accent-glow);
        border: 1px solid var(--border-s);
        color: var(--accent-text);
        font-size: 0.78rem;
      }
      .picked-list .icon {
        background: transparent;
        border: 0;
        padding: 0;
        cursor: pointer;
        color: inherit;
        font-size: 0.78rem;
        min-height: unset;
        opacity: 0.7;
      }
      .picked-list .icon:hover {
        opacity: 1;
      }
    `,
  ],
})
export class NovelFormGenreSelectorComponent {
  @Input() allGenres: Genre[] = [];
  @Input() selectedGenreIds: string[] = [];
  @Input() maxGenres = 5;
  @Input() disabled = false;
  @Output() genresChange = new EventEmitter<string[]>();

  get availableGenres(): Genre[] {
    const taken = new Set(this.selectedGenreIds);
    return this.allGenres.filter((g) => !taken.has(g.id));
  }

  get selectedGenres(): Genre[] {
    const taken = new Set(this.selectedGenreIds);
    return this.allGenres.filter((g) => taken.has(g.id));
  }

  onAdd(id: string): void {
    if (!id || this.selectedGenreIds.includes(id) || this.selectedGenreIds.length >= this.maxGenres)
      return;
    this.genresChange.emit([...this.selectedGenreIds, id]);
  }

  onRemove(id: string): void {
    this.genresChange.emit(this.selectedGenreIds.filter((x) => x !== id));
  }
}
