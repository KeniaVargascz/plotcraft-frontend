import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { CharacterSummary } from '../../core/models/character.model';
import { Genre } from '../../core/models/genre.model';
import { NovelRating, NovelStatus } from '../../core/models/novel.model';
import { WorldSummary } from '../../core/models/world.model';
import { AuthService } from '../../core/services/auth.service';
import { CharactersService } from '../../core/services/characters.service';
import { GenresService } from '../../core/services/genres.service';
import { NovelsService } from '../../core/services/novels.service';
import { WorldsService } from '../../core/services/worlds.service';

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
          <input [(ngModel)]="title" maxlength="200" [disabled]="saving()" />
        </label>

        <label>
          Estado
          <select [(ngModel)]="status" [disabled]="saving()">
            @for (item of statusOptions; track item) {
              <option [value]="item">{{ item }}</option>
            }
          </select>
        </label>

        <label>
          Rating
          <select [(ngModel)]="rating" [disabled]="saving()">
            @for (item of ratingOptions; track item) {
              <option [value]="item">{{ item }}</option>
            }
          </select>
        </label>

        <label class="full">
          Sinopsis
          <textarea
            [(ngModel)]="synopsis"
            rows="6"
            maxlength="3000"
            [disabled]="saving()"
          ></textarea>
        </label>

        <label class="full">
          Tags
          <input
            [(ngModel)]="tags"
            placeholder="fantasia, aventura, serial"
            [disabled]="saving()"
          />
        </label>

        <label class="full">
          Warnings
          <input
            [(ngModel)]="warnings"
            placeholder="violencia, lenguaje adulto"
            [disabled]="saving()"
          />
        </label>

        <fieldset class="full genres">
          <legend>Generos</legend>
          @for (genre of genres(); track genre.id) {
            <label>
              <input
                type="checkbox"
                [checked]="selectedGenreIds().includes(genre.id)"
                [disabled]="saving()"
                (change)="toggleGenre(genre)"
              />
              {{ genre.label }}
            </label>
          }
        </fieldset>

        <fieldset class="full genres">
          <legend>Personajes vinculados</legend>
          @if (!characters().length) {
            <p class="hint">
              Aun no tienes personajes creados. Puedes gestionarlos en Mis personajes.
            </p>
          } @else {
            @for (character of characters(); track character.id) {
              <label>
                <input
                  type="checkbox"
                  [checked]="selectedCharacterIds().includes(character.id)"
                  [disabled]="saving()"
                  (change)="toggleCharacter(character)"
                />
                {{ character.name }} · {{ character.role }}
              </label>
            }
          }
        </fieldset>

        <fieldset class="full linked-block">
          <legend>Mundos vinculados</legend>
          @if (!worlds().length) {
            <p class="hint">Aun no tienes mundos creados. Puedes gestionarlos en Mis mundos.</p>
          } @else {
            <div class="linked-selector">
              <select
                [(ngModel)]="pendingWorldId"
                name="pendingWorldId"
                [disabled]="saving()"
                (ngModelChange)="selectWorld($event)"
              >
                <option value="">Selecciona un mundo</option>
                @for (world of availableWorlds(); track world.id) {
                  <option [value]="world.id">{{ world.name }}</option>
                }
              </select>
            </div>

            @if (selectedWorlds().length) {
              <div class="selected-items">
                @for (world of selectedWorlds(); track world.id) {
                  <button
                    type="button"
                    class="linked-pill"
                    [disabled]="saving()"
                    (click)="removeWorld(world.id)"
                  >
                    <span>{{ world.name }}</span>
                    <strong>×</strong>
                  </button>
                }
              </div>
            } @else {
              <p class="hint">Todavia no has vinculado mundos a esta novela.</p>
            }
          }
        </fieldset>

        <label class="inline">
          <input
            type="checkbox"
            [(ngModel)]="isPublic"
            [disabled]="saving()"
            data-testid="is-public-toggle"
          />
          Hacer publica la novela
        </label>

        @if (saving()) {
          <p class="status full">Procesando novela...</p>
        }
        @if (statusMessage()) {
          <p class="status success full">{{ statusMessage() }}</p>
        }
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
      .genres,
      .linked-block,
      .linked-selector {
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
      .selected-items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .linked-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        min-height: 3rem;
        padding: 0.65rem 1rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .linked-pill strong {
        width: 1.5rem;
        height: 1.5rem;
        display: inline-grid;
        place-items: center;
        border-radius: 999px;
        background: color-mix(in srgb, var(--bg-card) 24%, transparent);
        font-size: 1rem;
        line-height: 1;
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

      .status {
        margin: 0;
        color: var(--accent-text);
        padding: 0.75rem 0.9rem;
        border-radius: 0.9rem;
        background: var(--accent-glow);
      }

      .status.success {
        background: color-mix(in srgb, #2e8b57 22%, var(--bg-surface));
        color: #b8ffd6;
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
  private readonly charactersService = inject(CharactersService);
  private readonly authService = inject(AuthService);
  private readonly worldsService = inject(WorldsService);

  readonly genres = signal<Genre[]>([]);
  readonly characters = signal<CharacterSummary[]>([]);
  readonly worlds = signal<WorldSummary[]>([]);
  readonly selectedGenreIds = signal<string[]>([]);
  readonly selectedCharacterIds = signal<string[]>([]);
  readonly initialCharacterIds = signal<string[]>([]);
  readonly selectedWorldIds = signal<string[]>([]);
  readonly initialWorldIds = signal<string[]>([]);
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly errorMessage = signal('');
  readonly statusMessage = signal('');
  readonly availableWorlds = computed(() =>
    this.worlds().filter((world) => !this.selectedWorldIds().includes(world.id)),
  );
  readonly selectedWorlds = computed(() => {
    const selected = new Set(this.selectedWorldIds());
    return this.worlds().filter((world) => selected.has(world.id));
  });

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
  pendingWorldId = '';

  ngOnInit() {
    this.genresService.list().subscribe((genres) => this.genres.set(genres));
    this.charactersService.listMine({ limit: 50, sort: 'updated' }).subscribe({
      next: (response) => this.characters.set(response.data),
      error: () => this.characters.set([]),
    });
    this.worldsService.listMine({ limit: 50, sort: 'updated' }).subscribe({
      next: (response) => this.worlds.set(response.data),
      error: () => this.worlds.set([]),
    });

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
        this.selectedCharacterIds.set(novel.characters.map((character) => character.id));
        this.initialCharacterIds.set(novel.characters.map((character) => character.id));
        this.selectedWorldIds.set(novel.worlds.map((world) => world.id));
        this.initialWorldIds.set(novel.worlds.map((world) => world.id));
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

  toggleCharacter(character: CharacterSummary) {
    this.selectedCharacterIds.update((current) =>
      current.includes(character.id)
        ? current.filter((id) => id !== character.id)
        : [...current, character.id],
    );
  }

  selectWorld(worldId: string) {
    if (!worldId || this.selectedWorldIds().includes(worldId)) {
      this.pendingWorldId = '';
      return;
    }

    this.selectedWorldIds.update((current) => [...current, worldId]);
    this.pendingWorldId = '';
  }

  removeWorld(worldId: string) {
    this.selectedWorldIds.update((current) => current.filter((id) => id !== worldId));
  }

  save() {
    if (this.saving() || !this.title.trim()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('');

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

    request
      .pipe(
        switchMap((novel) => this.syncCharacterLinks(novel.slug, novel)),
        switchMap((novel) => this.syncWorldLinks(novel.slug, novel)),
      )
      .subscribe({
        next: (novel) => {
          this.statusMessage.set('Novela guardada. Redirigiendo a capitulos...');
          this.initialCharacterIds.set(this.selectedCharacterIds());
          this.initialWorldIds.set(this.selectedWorldIds());
          this.saving.set(false);
          this.router.navigate(['/mis-novelas', novel.slug, 'capitulos']);
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set(
            'No se pudo guardar la novela. Revisa los datos e intenta de nuevo.',
          );
        },
      });
  }

  private syncCharacterLinks(novelSlug: string, novel: { slug: string }) {
    const username = this.authService.getCurrentUserSnapshot()?.username;
    if (!username) {
      return of(novel);
    }

    const selectedIds = new Set(this.selectedCharacterIds());
    const currentIds = new Set(this.initialCharacterIds());
    const byId = new Map(this.characters().map((character) => [character.id, character]));

    const toLink = [...selectedIds]
      .filter((id) => !currentIds.has(id))
      .map((id) => byId.get(id))
      .filter((character): character is CharacterSummary => Boolean(character));

    const toUnlink = [...currentIds]
      .filter((id) => !selectedIds.has(id))
      .map((id) => byId.get(id))
      .filter((character): character is CharacterSummary => Boolean(character));

    const operations = [
      ...toLink.map((character) =>
        this.charactersService.linkNovel(username, character.slug, novelSlug),
      ),
      ...toUnlink.map((character) =>
        this.charactersService.unlinkNovel(username, character.slug, novelSlug),
      ),
    ];

    return operations.length ? forkJoin(operations).pipe(switchMap(() => of(novel))) : of(novel);
  }

  private syncWorldLinks(novelSlug: string, novel: { slug: string }) {
    const selectedIds = new Set(this.selectedWorldIds());
    const currentIds = new Set(this.initialWorldIds());
    const byId = new Map(this.worlds().map((world) => [world.id, world]));

    const toLink = [...selectedIds]
      .filter((id) => !currentIds.has(id))
      .map((id) => byId.get(id))
      .filter((world): world is WorldSummary => Boolean(world));

    const toUnlink = [...currentIds]
      .filter((id) => !selectedIds.has(id))
      .map((id) => byId.get(id))
      .filter((world): world is WorldSummary => Boolean(world));

    const operations = [
      ...toLink.map((world) => this.worldsService.linkNovel(world.slug, novelSlug)),
      ...toUnlink.map((world) => this.worldsService.unlinkNovel(world.slug, novelSlug)),
    ];

    return operations.length ? forkJoin(operations).pipe(switchMap(() => of(novel))) : of(novel);
  }
}
