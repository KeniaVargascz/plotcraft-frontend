import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Genre } from '../../core/models/genre.model';
import { NovelRating, NovelStatus } from '../../core/models/novel.model';
import { GenresService } from '../../core/services/genres.service';
import { NovelsService } from '../../core/services/novels.service';

@Component({
  selector: 'app-novel-form-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="form-shell">
      <h1>{{ isEdit() ? 'Editar novela' : 'Nueva novela' }}</h1>

      <div class="form-grid">
        <label>
          Titulo
          <input [(ngModel)]="title" maxlength="200" />
        </label>

        <label>
          Estado
          <select [(ngModel)]="status">
            @for (item of statusOptions; track item) {
              <option [value]="item">{{ item }}</option>
            }
          </select>
        </label>

        <label>
          Rating
          <select [(ngModel)]="rating">
            @for (item of ratingOptions; track item) {
              <option [value]="item">{{ item }}</option>
            }
          </select>
        </label>

        <label class="full">
          Sinopsis
          <textarea [(ngModel)]="synopsis" rows="6" maxlength="3000"></textarea>
        </label>

        <label class="full">
          Tags
          <input [(ngModel)]="tags" placeholder="fantasia, aventura, serial" />
        </label>

        <label class="full">
          Warnings
          <input [(ngModel)]="warnings" placeholder="violencia, lenguaje adulto" />
        </label>

        <fieldset class="full genres">
          <legend>Generos</legend>
          @for (genre of genres(); track genre.id) {
            <label>
              <input
                type="checkbox"
                [checked]="selectedGenreIds().includes(genre.id)"
                (change)="toggleGenre(genre)"
              />
              {{ genre.label }}
            </label>
          }
        </fieldset>

        <label class="inline">
          <input type="checkbox" [(ngModel)]="isPublic" />
          Hacer publica la novela
        </label>
        @if (!isEdit()) {
          <p class="hint full">
            La novela se crea como privada. Podras hacerla publica despues de publicar al menos un
            capitulo.
          </p>
        }
        @if (errorMessage()) {
          <p class="error full">{{ errorMessage() }}</p>
        }
      </div>

      <div class="actions">
        <button type="button" (click)="save()" [disabled]="saving() || !title.trim()">
          {{ saving() ? 'Guardando...' : 'Guardar novela' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .form-shell,
      .form-grid {
        display: grid;
        gap: 1rem;
      }
      .form-shell {
        padding: 1.25rem;
        border-radius: 1.25rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
      }
      .form-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .full {
        grid-column: 1 / -1;
      }
      label,
      .genres {
        display: grid;
        gap: 0.5rem;
      }
      input,
      textarea,
      select,
      button {
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.75rem 0.9rem;
      }
      .genres {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .inline {
        display: flex;
        align-items: center;
      }
      .hint {
        margin: 0;
        color: var(--text-2);
      }
      .error {
        margin: 0;
        color: #ff8b8b;
      }
      @media (max-width: 700px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class NovelFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly novelsService = inject(NovelsService);
  private readonly genresService = inject(GenresService);

  readonly genres = signal<Genre[]>([]);
  readonly selectedGenreIds = signal<string[]>([]);
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly errorMessage = signal('');

  readonly statusOptions: NovelStatus[] = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];
  readonly ratingOptions: NovelRating[] = ['G', 'PG', 'PG13', 'R', 'EXPLICIT'];

  slug: string | null = null;
  title = '';
  synopsis = '';
  status: NovelStatus = 'DRAFT';
  rating: NovelRating = 'G';
  tags = '';
  warnings = '';
  isPublic = false;

  ngOnInit() {
    this.genresService.list().subscribe((genres) => this.genres.set(genres));

    this.route.paramMap.subscribe((params) => {
      this.slug = params.get('slug');
      this.isEdit.set(Boolean(this.slug));

      if (!this.slug) {
        return;
      }

      this.novelsService.getBySlug(this.slug).subscribe((novel) => {
        this.title = novel.title;
        this.synopsis = novel.synopsis || '';
        this.status = novel.status;
        this.rating = novel.rating;
        this.tags = novel.tags.join(', ');
        this.warnings = novel.warnings.join(', ');
        this.isPublic = novel.isPublic;
        this.selectedGenreIds.set(novel.genres.map((genre) => genre.id));
      });
    });
  }

  toggleGenre(genre: Genre) {
    this.selectedGenreIds.update((current) =>
      current.includes(genre.id)
        ? current.filter((id) => id !== genre.id)
        : current.length < 5
          ? [...current, genre.id]
          : current,
    );
  }

  save() {
    this.saving.set(true);
    this.errorMessage.set('');

    const payload = {
      title: this.title,
      synopsis: this.synopsis || null,
      status: this.status,
      rating: this.rating,
      tags: this.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      warnings: this.warnings
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      genreIds: this.selectedGenreIds(),
      isPublic: this.isEdit() ? this.isPublic : false,
    };

    const request = this.slug
      ? this.novelsService.update(this.slug, payload)
      : this.novelsService.create(payload);

    request.subscribe({
      next: (novel) => {
        this.saving.set(false);
        this.router.navigate(['/mis-novelas', novel.slug, 'capitulos']);
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('No se pudo guardar la novela. Revisa los datos e intenta de nuevo.');
      },
    });
  }
}
