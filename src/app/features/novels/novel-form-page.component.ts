import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { CharacterSummary } from '../../core/models/character.model';
import { Genre } from '../../core/models/genre.model';
import { LanguageCatalogItem } from '../../core/models/language.model';
import { NovelRating, NovelStatus, RomanceGenre } from '../../core/models/novel.model';
import { ROMANCE_GENRES } from '../../shared/constants/romance-genres';
import { WorldSummary } from '../../core/models/world.model';
import { AuthService } from '../../core/services/auth.service';
import { CharactersService } from '../../core/services/characters.service';
import { GenresService } from '../../core/services/genres.service';
import { LanguagesService } from '../../core/services/languages.service';
import { NovelsService } from '../../core/services/novels.service';
import { WorldsService } from '../../core/services/worlds.service';
import { TagChipsInputComponent } from '../../shared/components/tag-chips-input/tag-chips-input.component';
import { SeriesService } from '../series/services/series.service';
import { SeriesDetail, SeriesType } from '../series/models/series.model';
import { forkJoin as rxForkJoin } from 'rxjs';

interface PairingDraft {
  characterAId: string;
  characterBId: string;
  isMain: boolean;
}

@Component({
  selector: 'app-novel-form-page',
  standalone: true,
  imports: [FormsModule, TagChipsInputComponent],
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

        <label>
          Idioma
          <select [(ngModel)]="languageId" [disabled]="saving()">
            @for (lang of languages(); track lang.id) {
              <option [value]="lang.id">{{ lang.name }}</option>
            }
          </select>
        </label>

        <fieldset class="full">
          <legend>Géneros del romance</legend>
          <div class="romance-checks">
            @for (g of romanceGenreOptions; track g.value) {
              <label class="check-row">
                <input
                  type="checkbox"
                  [checked]="selectedRomanceGenres().includes(g.value)"
                  [disabled]="saving()"
                  (change)="toggleRomanceGenre(g.value)"
                />
                {{ g.label }}
              </label>
            }
          </div>
        </fieldset>

        <label class="full">
          Sinopsis
          <textarea
            [(ngModel)]="synopsis"
            rows="6"
            maxlength="3000"
            [disabled]="saving()"
          ></textarea>
        </label>

        <div class="full">
          <label>Tags</label>
          <app-tag-chips-input
            [tags]="tagList()"
            [maxTags]="20"
            placeholder="Añadir tag y presionar Enter..."
            (tagsChange)="onTagsChange($event)"
          />
        </div>

        <div class="full">
          <label>Warnings</label>
          <app-tag-chips-input
            [tags]="warningList()"
            [maxTags]="20"
            placeholder="Añadir warning y presionar Enter..."
            (tagsChange)="onWarningsChange($event)"
          />
        </div>

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

        <fieldset class="full linked-block">
          <legend>Personajes vinculados</legend>
          @if (!characters().length) {
            <p class="hint">
              Aun no tienes personajes creados. Puedes gestionarlos en Mis personajes.
            </p>
          } @else {
            <div class="char-search">
              <input
                type="text"
                [(ngModel)]="characterSearch"
                [disabled]="saving()"
                placeholder="Buscar personaje por nombre..."
                (focus)="charDropdownOpen.set(true)"
              />
              @if (charDropdownOpen() && filteredCharacters().length) {
                <ul class="char-dropdown">
                  @for (character of filteredCharacters(); track character.id) {
                    <li>
                      <button
                        type="button"
                        [disabled]="saving() || selectedCharacterIds().includes(character.id)"
                        (click)="addCharacter(character)"
                      >
                        {{ character.name }} · {{ character.role }}
                        @if (selectedCharacterIds().includes(character.id)) {
                          <span class="picked">✓</span>
                        }
                      </button>
                    </li>
                  }
                </ul>
              }
              @if (charDropdownOpen() && !filteredCharacters().length && characterSearch.trim()) {
                <p class="hint">Sin resultados.</p>
              }
            </div>

            @if (selectedCharacterIds().length) {
              <ul class="picked-list">
                @for (id of selectedCharacterIds(); track id) {
                  @if (characterById(id); as character) {
                    <li>
                      <span>{{ character.name }} · {{ character.role }}</span>
                      <button
                        type="button"
                        class="icon"
                        [disabled]="saving()"
                        (click)="toggleCharacter(character)"
                      >
                        ✕
                      </button>
                    </li>
                  }
                }
              </ul>
            } @else {
              <p class="hint">No hay personajes seleccionados.</p>
            }
          }
        </fieldset>

        <fieldset class="full linked-block">
          <legend>Parejas</legend>
          @if (selectedCharacterIds().length < 2) {
            <p class="hint">Vincula al menos 2 personajes para crear parejas.</p>
          } @else {
            <div class="pairing-section">
              <h4>Pareja principal (protagonistas)</h4>
              @if (mainPairing(); as mp) {
                <div class="pairing-row">
                  <span class="pair-label">{{ characterById(mp.characterAId)?.name || '?' }} × {{ characterById(mp.characterBId)?.name || '?' }}</span>
                  <button type="button" class="icon" (click)="removePairing(mp)">✕</button>
                </div>
              } @else {
                <div class="pairing-form">
                  <select [ngModel]="mainPairCharA" (ngModelChange)="mainPairCharA = $event" name="mainPairCharA">
                    <option [ngValue]="null">Personaje 1</option>
                    @for (c of pairableCharacters(); track c.id) {
                      <option [ngValue]="c.id">{{ c.name }}</option>
                    }
                  </select>
                  <span>×</span>
                  <select [ngModel]="mainPairCharB" (ngModelChange)="mainPairCharB = $event" name="mainPairCharB">
                    <option [ngValue]="null">Personaje 2</option>
                    @for (c of pairableCharacters(); track c.id) {
                      <option [ngValue]="c.id">{{ c.name }}</option>
                    }
                  </select>
                  <button type="button" (click)="addMainPairing()">Definir</button>
                </div>
                @if (mainPairError()) {
                  <p class="pair-error">{{ mainPairError() }}</p>
                }
              }
            </div>

            <div class="pairing-section">
              <h4>Parejas secundarias</h4>
              @if (secondaryPairings().length) {
                <ul class="pairings-list">
                  @for (p of secondaryPairings(); track $index) {
                    <li>
                      <span class="pair-label">{{ characterById(p.characterAId)?.name || '?' }} × {{ characterById(p.characterBId)?.name || '?' }}</span>
                      <button type="button" class="icon" (click)="removePairing(p)">✕</button>
                    </li>
                  }
                </ul>
              }
              <div class="pairing-form">
                <select [ngModel]="secondaryPairCharA" (ngModelChange)="secondaryPairCharA = $event" name="secondaryPairCharA">
                  <option [ngValue]="null">Personaje 1</option>
                  @for (c of pairableCharacters(); track c.id) {
                    <option [ngValue]="c.id">{{ c.name }}</option>
                  }
                </select>
                <span>×</span>
                <select [ngModel]="secondaryPairCharB" (ngModelChange)="secondaryPairCharB = $event" name="secondaryPairCharB">
                  <option [ngValue]="null">Personaje 2</option>
                  @for (c of pairableCharacters(); track c.id) {
                    <option [ngValue]="c.id">{{ c.name }}</option>
                  }
                </select>
                <button type="button" (click)="addSecondaryPairing()">Añadir</button>
              </div>
              @if (secondaryPairError()) {
                <p class="pair-error">{{ secondaryPairError() }}</p>
              }
            </div>
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

      @if (isEdit() && novelId()) {
        <section class="collections-section">
          <h2>Agregar esta novela a una colección</h2>

          @if (collections().length === 0) {
            <p class="hint">No tienes colecciones aún.</p>
          } @else {
            <ul class="coll-list">
              @for (col of collections(); track col.id) {
                <li>
                  <span>{{ col.title }} ({{ col.novelsCount }} novelas)</span>
                  @if (isNovelIn(col)) {
                    <button type="button" disabled>✓ Ya incluida</button>
                  } @else {
                    <button type="button" (click)="addToCollection(col)">+ Agregar</button>
                  }
                </li>
              }
            </ul>
          }

          @if (!showCreateColl()) {
            <button type="button" (click)="showCreateColl.set(true)">
              + Crear nueva colección
            </button>
          } @else {
            <div class="create-coll-form">
              <input [(ngModel)]="newCollTitle" placeholder="Título de la colección" />
              <select [(ngModel)]="newCollType">
                <option value="SAGA">Saga</option>
                <option value="TRILOGY">Trilogía</option>
                <option value="DILOGY">Bilogía</option>
                <option value="SERIES">Serie</option>
              </select>
              <textarea
                [(ngModel)]="newCollDescription"
                placeholder="Descripción (opcional)"
              ></textarea>
              <button type="button" (click)="createCollectionAndAdd()">Crear y agregar</button>
              <button type="button" (click)="showCreateColl.set(false)">Cancelar</button>
            </div>
          }
        </section>
      }

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
      .char-search {
        position: relative;
      }
      .char-dropdown {
        list-style: none;
        margin: 0.25rem 0 0;
        padding: 0.25rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--bg-card);
        max-height: 220px;
        overflow-y: auto;
        position: absolute;
        left: 0;
        right: 0;
        z-index: 5;
        box-shadow: 0 12px 28px -16px var(--shadow);
      }
      .char-dropdown li {
        padding: 0;
      }
      .char-dropdown button {
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        border-radius: 0.6rem;
        padding: 0.55rem 0.7rem;
        cursor: pointer;
        color: var(--text-1);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .char-dropdown button:hover:not(:disabled) {
        background: var(--bg-surface);
      }
      .char-dropdown button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .char-dropdown .picked {
        color: var(--accent-text);
        font-weight: 700;
      }
      .picked-list {
        list-style: none;
        margin: 0.5rem 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .picked-list li {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.75rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .picked-list .icon {
        background: transparent;
        border: 0;
        padding: 0;
        cursor: pointer;
        color: inherit;
        font-size: 0.85rem;
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

      .pairing-section { display: grid; gap: 0.5rem; margin-bottom: 0.75rem; }
      .pairing-section h4 { margin: 0; font-size: 0.9rem; color: var(--text-2); }
      .romance-checks { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.5rem; }
      .romance-checks .check-row { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.7rem; border: 1px solid var(--border); border-radius: 0.6rem; background: var(--bg-surface); cursor: pointer; font-size: 0.85rem; }
      .pairing-form { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
      .pairing-form select { flex: 1; min-width: 120px; }
      .pairing-form span { color: var(--text-2); font-weight: bold; }
      .pairing-row, .pairings-list li { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--accent-glow); color: var(--accent-text); border-radius: 999px; gap: 0.5rem; }
      .pairings-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.4rem; }
      .pair-label { font-weight: 600; }
      .pair-error { color: #ff8b8b; font-size: 0.8rem; margin: 0.4rem 0 0; }

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
  private readonly languagesService = inject(LanguagesService);
  private readonly charactersService = inject(CharactersService);
  private readonly authService = inject(AuthService);
  private readonly worldsService = inject(WorldsService);
  private readonly seriesService = inject(SeriesService);

  readonly genres = signal<Genre[]>([]);
  readonly characters = signal<CharacterSummary[]>([]);
  readonly worlds = signal<WorldSummary[]>([]);
  readonly languages = signal<LanguageCatalogItem[]>([]);
  readonly selectedGenreIds = signal<string[]>([]);
  readonly selectedCharacterIds = signal<string[]>([]);
  readonly initialCharacterIds = signal<string[]>([]);
  readonly charDropdownOpen = signal(false);
  characterSearch = '';

  readonly filteredCharacters = computed(() => {
    const term = this.characterSearch.trim().toLowerCase();
    const all = this.characters();
    if (!term) return all.slice(0, 50);
    return all
      .filter((c) => c.name.toLowerCase().includes(term))
      .slice(0, 50);
  });

  characterById(id: string): CharacterSummary | undefined {
    return this.characters().find((c) => c.id === id);
  }

  addCharacter(character: CharacterSummary) {
    if (this.selectedCharacterIds().includes(character.id)) return;
    this.selectedCharacterIds.update((current) => [...current, character.id]);
    this.characterSearch = '';
    this.charDropdownOpen.set(false);
  }
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

  readonly novelId = signal<string | null>(null);
  readonly collections = signal<SeriesDetail[]>([]);
  readonly showCreateColl = signal(false);
  newCollTitle = '';
  newCollType: SeriesType = 'SAGA';
  newCollDescription = '';

  readonly statusOptions: NovelStatus[] = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];
  readonly ratingOptions: NovelRating[] = ['G', 'PG', 'PG13', 'R', 'EXPLICIT'];

  slug: string | null = null;
  title = '';
  synopsis = '';
  status: NovelStatus = 'DRAFT';
  rating: NovelRating = 'G';
  languageId = '';
  readonly tagList = signal<string[]>([]);
  readonly warningList = signal<string[]>([]);

  onTagsChange(tags: string[]) {
    this.tagList.set(tags);
  }

  onWarningsChange(warnings: string[]) {
    this.warningList.set(warnings);
  }
  isPublic = false;
  pendingWorldId = '';

  readonly selectedRomanceGenres = signal<RomanceGenre[]>([]);
  readonly romanceGenreOptions = ROMANCE_GENRES;

  toggleRomanceGenre(value: RomanceGenre) {
    this.selectedRomanceGenres.update((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  }

  readonly pairings = signal<PairingDraft[]>([]);
  mainPairCharA: string | null = null;
  mainPairCharB: string | null = null;
  secondaryPairCharA: string | null = null;
  secondaryPairCharB: string | null = null;

  readonly pairableCharacters = computed(() =>
    this.characters().filter((c) => this.selectedCharacterIds().includes(c.id)),
  );

  readonly mainPairing = computed(() => this.pairings().find((p) => p.isMain) ?? null);
  readonly secondaryPairings = computed(() => this.pairings().filter((p) => !p.isMain));
  readonly mainPairError = signal<string | null>(null);
  readonly secondaryPairError = signal<string | null>(null);

  addMainPairing() {
    this.mainPairError.set(null);
    if (!this.mainPairCharA || !this.mainPairCharB) {
      this.mainPairError.set('Debes seleccionar 2 personajes para formar una pareja.');
      return;
    }
    if (this.mainPairCharA === this.mainPairCharB) {
      this.mainPairError.set('No puedes seleccionar el mismo personaje dos veces.');
      return;
    }
    this.pairings.update((list) => [
      ...list.filter((p) => !p.isMain),
      { characterAId: this.mainPairCharA!, characterBId: this.mainPairCharB!, isMain: true },
    ]);
    this.mainPairCharA = null;
    this.mainPairCharB = null;
  }

  addSecondaryPairing() {
    this.secondaryPairError.set(null);
    if (!this.secondaryPairCharA || !this.secondaryPairCharB) {
      this.secondaryPairError.set('Debes seleccionar 2 personajes para formar una pareja.');
      return;
    }
    if (this.secondaryPairCharA === this.secondaryPairCharB) {
      this.secondaryPairError.set('No puedes seleccionar el mismo personaje dos veces.');
      return;
    }
    const a = this.secondaryPairCharA;
    const b = this.secondaryPairCharB;
    const exists = this.pairings().some(
      (p) => (p.characterAId === a && p.characterBId === b) || (p.characterAId === b && p.characterBId === a),
    );
    if (exists) {
      this.secondaryPairError.set('Esta pareja ya existe.');
      return;
    }
    this.pairings.update((list) => [...list, { characterAId: a, characterBId: b, isMain: false }]);
    this.secondaryPairCharA = null;
    this.secondaryPairCharB = null;
  }

  removePairing(p: PairingDraft) {
    this.pairings.update((list) => list.filter((x) => x !== p));
  }

  ngOnInit() {
    this.genresService.list().subscribe((genres) => this.genres.set(genres));
    this.languagesService.list().subscribe({
      next: (languages) => {
        this.languages.set(languages);
        if (!this.languageId) {
          this.languageId = languages.find((language) => language.code === 'es')?.id ?? languages[0]?.id ?? '';
        }
      },
      error: () => this.languages.set([]),
    });
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
        this.novelId.set(novel.id);
        this.loadCollections();
        this.title = novel.title;
        this.synopsis = novel.synopsis || '';
        this.status = novel.status;
        this.rating = novel.rating;
        this.languageId = novel.languageId;
        this.tagList.set(novel.tags ?? []);
        this.warningList.set(novel.warnings ?? []);
        this.isPublic = novel.isPublic;
        this.selectedGenreIds.set(novel.genres.map((genre) => genre.id));
        this.selectedCharacterIds.set(novel.characters.map((character) => character.id));
        this.initialCharacterIds.set(novel.characters.map((character) => character.id));
        // Merge novel's characters into the local cache so we always have slug+username for sync
        const merged = new Map(this.characters().map((c) => [c.id, c]));
        for (const c of novel.characters) {
          if (!merged.has(c.id)) {
            merged.set(c.id, c as unknown as CharacterSummary);
          }
        }
        this.characters.set(Array.from(merged.values()));
        this.selectedWorldIds.set(novel.worlds.map((world) => world.id));
        this.initialWorldIds.set(novel.worlds.map((world) => world.id));
        this.selectedRomanceGenres.set(novel.romanceGenres ?? []);
        this.pairings.set(
          (novel.pairings ?? []).map((p) => ({
            characterAId: p.characterA.id,
            characterBId: p.characterB.id,
            isMain: p.isMain,
          })),
        );
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
    if (this.saving() || !this.title.trim() || !this.languageId) {
      return;
    }

    // Auto-commit any pending pair selections that the user filled but didn't click "Definir/Añadir"
    if (this.mainPairCharA && this.mainPairCharB && !this.mainPairing()) {
      this.addMainPairing();
      if (this.mainPairError()) {
        return;
      }
    }
    if (this.secondaryPairCharA && this.secondaryPairCharB) {
      this.addSecondaryPairing();
      if (this.secondaryPairError()) {
        return;
      }
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('');

    const payload = {
      title: this.title,
      synopsis: this.synopsis || null,
      status: this.status,
      rating: this.rating,
      languageId: this.languageId,
      tags: this.tagList(),
      warnings: this.warningList(),
      genreIds: this.selectedGenreIds(),
      isPublic: this.isEdit() ? this.isPublic : false,
      romanceGenres: this.selectedRomanceGenres(),
      pairings: this.pairings(),
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
          this.statusMessage.set('Novela guardada.');
          this.initialCharacterIds.set(this.selectedCharacterIds());
          this.initialWorldIds.set(this.selectedWorldIds());
          this.saving.set(false);
          this.router.navigate(['/novelas', novel.slug]);
        },
        error: (err) => {
          this.saving.set(false);
          const e = err as { error?: { error?: { message?: string }; message?: string }; message?: string };
          const msg =
            e?.error?.error?.message ||
            e?.error?.message ||
            e?.message ||
            'No se pudo guardar la novela. Revisa los datos e intenta de nuevo.';
          this.errorMessage.set(msg);
        },
      });
  }

  private syncCharacterLinks(novelSlug: string, novel: { slug: string }) {
    const fallbackUsername = this.authService.getCurrentUserSnapshot()?.username;

    const selectedIds = new Set(this.selectedCharacterIds());
    const currentIds = new Set(this.initialCharacterIds());
    const byId = new Map(this.characters().map((character) => [character.id, character]));

    const resolveAuthor = (character: CharacterSummary | undefined): string | null => {
      return character?.author?.username || fallbackUsername || null;
    };

    const toLink = [...selectedIds]
      .filter((id) => !currentIds.has(id))
      .map((id) => byId.get(id))
      .filter((character): character is CharacterSummary => Boolean(character));

    const toUnlink = [...currentIds]
      .filter((id) => !selectedIds.has(id))
      .map((id) => byId.get(id))
      .filter((character): character is CharacterSummary => Boolean(character));

    const operations = [
      ...toLink
        .map((character) => {
          const author = resolveAuthor(character);
          if (!author || !character.slug) return null;
          return this.charactersService.linkNovel(author, character.slug, novelSlug);
        })
        .filter((op): op is NonNullable<typeof op> => op !== null),
      ...toUnlink
        .map((character) => {
          const author = resolveAuthor(character);
          if (!author || !character.slug) return null;
          return this.charactersService.unlinkNovel(author, character.slug, novelSlug);
        })
        .filter((op): op is NonNullable<typeof op> => op !== null),
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

  loadCollections() {
    const username = this.authService.getCurrentUserSnapshot()?.username;
    if (!username) return;
    this.seriesService.listByAuthor(username, { limit: 50 }).subscribe({
      next: (response) => {
        const summaries = response.data;
        if (!summaries.length) {
          this.collections.set([]);
          return;
        }
        rxForkJoin(summaries.map((s) => this.seriesService.getBySlug(s.slug))).subscribe({
          next: (details) => this.collections.set(details),
          error: () => this.collections.set([]),
        });
      },
      error: () => this.collections.set([]),
    });
  }

  isNovelIn(col: SeriesDetail): boolean {
    const id = this.novelId();
    if (!id) return false;
    return (col.novels || []).some((n) => n.id === id);
  }

  addToCollection(col: SeriesDetail) {
    const id = this.novelId();
    if (!id) {
      this.errorMessage.set('Guarda primero la novela antes de agregarla a una colección.');
      return;
    }
    const nextOrder = (col.novels?.length || 0) + 1;
    this.errorMessage.set('');
    this.seriesService.addNovel(col.slug, id, nextOrder).subscribe({
      next: () => {
        this.statusMessage.set(`Agregada a "${col.title}".`);
        this.loadCollections();
      },
      error: (err) => {
        const msg =
          err?.error?.error?.message ||
          err?.error?.message ||
          err?.message ||
          'No se pudo agregar la novela a la colección.';
        this.errorMessage.set(msg);
      },
    });
  }

  createCollectionAndAdd() {
    const id = this.novelId();
    if (!id) {
      this.errorMessage.set('Guarda primero la novela antes de crear una colección.');
      return;
    }
    if (!this.newCollTitle.trim()) {
      this.errorMessage.set('El título de la colección es obligatorio.');
      return;
    }

    this.errorMessage.set('');
    this.seriesService
      .create({
        title: this.newCollTitle.trim(),
        type: this.newCollType,
        description: this.newCollDescription.trim() || undefined,
        novelIds: [id],
      })
      .subscribe({
        next: () => {
          this.newCollTitle = '';
          this.newCollDescription = '';
          this.newCollType = 'SAGA';
          this.showCreateColl.set(false);
          this.statusMessage.set('Colección creada y novela agregada.');
          this.loadCollections();
        },
        error: (err) => {
          const msg =
            err?.error?.error?.message ||
            err?.error?.message ||
            err?.message ||
            'No se pudo crear la colección.';
          this.errorMessage.set(msg);
        },
      });
  }
}
