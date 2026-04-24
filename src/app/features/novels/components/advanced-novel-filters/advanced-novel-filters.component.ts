import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { CharacterSummary } from '../../../../core/models/character.model';
import { CharactersService } from '../../../../core/services/characters.service';
import { LanguageCatalogItem } from '../../../../core/models/language.model';
import { LanguagesService } from '../../../../core/services/languages.service';
import { CommunityService } from '../../../communities/services/community.service';
import { Community } from '../../../communities/models/community.model';
import { RomanceGenreCatalogItem } from '../../../../core/models/romance-genre.model';
import { RomanceGenresService } from '../../../../core/services/romance-genres.service';
import { TagChipsInputComponent } from '../../../../shared/components/tag-chips-input/tag-chips-input.component';
import { TranslationService } from '../../../../core/services/translation.service';
import { CatalogWarningItem } from '../../../../core/models/warning.model';
import { WarningsService } from '../../../../core/services/warnings.service';

export interface NovelFilters {
  languageId?: string | null;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
  tags?: string[];
  status?: string | null;
  sortBy?: string | null;
  rating?: string | null;
  romanceGenreIds?: string[] | null;
  warningIds?: string[] | null;
  pairings?: string[] | null;
  novelType?: 'ORIGINAL' | 'FANFIC' | '' | null;
  fandomSlug?: string | null;
}

@Component({
  selector: 'app-advanced-novel-filters',
  standalone: true,
  imports: [FormsModule, TagChipsInputComponent],
  template: `
    <div class="wrap">
      <button type="button" class="toggle" (click)="toggle()">
        <span>Filtros avanzados</span>
        @if (activeCount > 0) {
          <span class="badge">{{ activeCount }}</span>
        }
        <span class="chevron" [class.open]="expanded()">v</span>
      </button>

      @if (expanded()) {
        <div class="panel">
          <div class="grid">
            <label class="field">
              <span class="field-label">Tipo de novela</span>
              <select
                [ngModel]="filters.novelType ?? ''"
                (ngModelChange)="onNovelTypeChange($event)"
              >
                <option [ngValue]="''">Todas</option>
                <option [ngValue]="'ORIGINAL'">Solo originales</option>
                <option [ngValue]="'FANFIC'">Solo fanfics</option>
              </select>
            </label>

            @if (filters.novelType === 'FANFIC') {
              <label class="field">
                <span class="field-label">Fandom / Comunidad</span>
                <select
                  [ngModel]="filters.fandomSlug ?? ''"
                  (ngModelChange)="filters.fandomSlug = $event || null"
                >
                  <option [ngValue]="''">Todos</option>
                  @for (com of fandomOptions(); track com.id) {
                    <option [ngValue]="com.slug">{{ com.name }}</option>
                  }
                </select>
              </label>
            }

            <label class="field">
              <span class="field-label">Idioma</span>
              <select [(ngModel)]="filters.languageId">
                <option [ngValue]="null">Todos los idiomas</option>
                @for (l of languages(); track l.id) {
                  <option [ngValue]="l.id">{{ l.name }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="field-label">Ordenar por</span>
              <select [(ngModel)]="filters.sortBy">
                @for (s of sortOptions; track s.value) {
                  <option [ngValue]="s.value">{{ s.label }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="field-label">Clasificacion</span>
              <select [(ngModel)]="filters.rating">
                @for (r of ratingOptions; track r.value) {
                  <option [ngValue]="r.value">{{ r.label }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="field-label">Actualizado desde</span>
              <input type="date" [(ngModel)]="filters.updatedAfter" />
            </label>

            <label class="field">
              <span class="field-label">Actualizado hasta</span>
              <input type="date" [(ngModel)]="filters.updatedBefore" />
            </label>

            <label class="field span-full">
              <span class="field-label">Etiquetas</span>
              <app-tag-chips-input
                [tags]="tags"
                (tagsChange)="tags = $event"
                placeholder="Añadir etiqueta..."
              />
            </label>

            <div class="field span-full">
              <span class="field-label">Advertencias de contenido</span>
              @if (selectedWarningIds.length) {
                <div class="warning-chips">
                  @for (id of selectedWarningIds; track id) {
                    <span class="warning-chip">
                      {{ getWarningLabel(id) }}
                      <button type="button" (click)="toggleWarning(id)">✕</button>
                    </span>
                  }
                </div>
              }
              <select (change)="onWarningSelect($event)">
                <option value="">Seleccionar advertencia</option>
                @for (w of availableWarnings(); track w.id) {
                  <option [value]="w.id">{{ w.label }}</option>
                }
              </select>
            </div>

            <div class="field span-full">
              <span class="field-label">Géneros del romance</span>
              <div class="romance-pills">
                @for (g of romanceGenres(); track g.id) {
                  <button
                    type="button"
                    class="pill"
                    [class.selected]="selectedRomanceGenreIds.includes(g.id)"
                    (click)="toggleRomanceGenre(g.id)"
                  >
                    {{ g.label }}
                  </button>
                }
              </div>
            </div>

            @if (pairingsAllowed) {
              <div class="field span-full">
                <span class="field-label">Parejas</span>
                @if (pairingsList.length) {
                  <ul class="pairing-pills">
                    @for (p of pairingsList; track $index) {
                      <li>
                        <span>{{ p.a }} / {{ p.b }}</span>
                        <button type="button" (click)="removePairingEntry($index)">✕</button>
                      </li>
                    }
                  </ul>
                }
                <div class="pairing-inputs">
                  <div class="char-search">
                    <input
                      type="text"
                      [ngModel]="pairingA"
                      (ngModelChange)="onPairingAChange($event)"
                      (focus)="pairingADropdownOpen.set(true)"
                      placeholder="Personaje A"
                    />
                    @if (pairingADropdownOpen() && pairingASuggestions().length) {
                      <ul class="dropdown">
                        @for (c of pairingASuggestions(); track c.id) {
                          <li>
                            <button type="button" (click)="selectPairingA(c.name)">
                              {{ c.name }}
                              <small>@{{ c.author.username }}</small>
                            </button>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                  <span class="pair-sep">/</span>
                  <div class="char-search">
                    <input
                      type="text"
                      [ngModel]="pairingB"
                      (ngModelChange)="onPairingBChange($event)"
                      (focus)="pairingBDropdownOpen.set(true)"
                      placeholder="Personaje B"
                    />
                    @if (pairingBDropdownOpen() && pairingBSuggestions().length) {
                      <ul class="dropdown">
                        @for (c of pairingBSuggestions(); track c.id) {
                          <li>
                            <button type="button" (click)="selectPairingB(c.name)">
                              {{ c.name }}
                              <small>@{{ c.author.username }}</small>
                            </button>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                  <button type="button" (click)="addPairingEntry()">+ Añadir</button>
                </div>
                @if (pairingError) {
                  <p class="pair-error">{{ pairingError }}</p>
                }
              </div>
            } @else {
              <p class="legend span-full">
                Para filtrar por parejas, agrega el género <strong>Fanfiction</strong> en los
                filtros generales.
              </p>
            }

            <label class="field checkbox span-full">
              <input type="checkbox" [(ngModel)]="onlyCompleted" />
              Solo completas
            </label>
          </div>

          <div class="actions">
            <button type="button" (click)="clear()">Limpiar avanzados</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .wrap {
        display: grid;
        gap: 0.5rem;
        width: 100%;
        min-width: 0;
      }
      .toggle {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        width: 100%;
        padding: 0.55rem 0.75rem;
        border-radius: 0.65rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font: inherit;
        font-size: 0.82rem;
        transition: border-color 0.15s;
      }
      .toggle:hover {
        border-color: var(--border-s);
      }
      .badge {
        background: var(--accent-glow);
        color: var(--accent-text);
        padding: 0.08rem 0.45rem;
        border-radius: 999px;
        font-size: 0.65rem;
        font-weight: 700;
      }
      .chevron {
        margin-left: auto;
        transition: transform 0.2s;
      }
      .chevron.open {
        transform: rotate(180deg);
      }
      .panel {
        display: grid;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.65rem;
        min-width: 0;
      }
      .span-full {
        grid-column: 1 / -1;
      }
      .field {
        display: grid;
        gap: 0.25rem;
        color: var(--text-2);
        font-size: 0.78rem;
        min-width: 0;
      }
      .field-label {
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.72rem;
      }
      .field input,
      .field select {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
      }
      .checkbox {
        flex-direction: row;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .checkbox input {
        width: auto;
      }
      input,
      select,
      button {
        padding: 0.5rem 0.65rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        font-size: 0.85rem;
      }
      input:focus,
      select:focus {
        outline: none;
        border-color: var(--accent);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .legend {
        margin: 0;
        padding: 0.5rem 0.65rem;
        border-radius: 0.5rem;
        background: color-mix(in srgb, var(--accent-glow) 60%, transparent);
        border-left: 3px solid var(--accent-dim);
        color: var(--text-2);
        font-size: 0.75rem;
        line-height: 1.5;
      }
      .legend strong {
        color: var(--accent-text);
      }
      .primary {
        background: var(--accent);
        color: var(--bg-base);
        border-color: transparent;
        cursor: pointer;
        font-weight: 600;
      }
      button {
        cursor: pointer;
      }
      .pairing-inputs {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        min-width: 0;
      }
      .pairing-inputs input {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
      }
      .pairing-inputs > button {
        white-space: nowrap;
      }
      .pair-sep {
        color: var(--text-2);
        font-weight: 600;
        text-align: center;
      }
      @media (max-width: 560px) {
        .pairing-inputs {
          grid-template-columns: 1fr;
        }
        .pair-sep {
          display: none;
        }
        .pairing-inputs > button {
          width: 100%;
        }
      }
      .char-search {
        position: relative;
        min-width: 0;
        width: 100%;
      }
      .char-search input {
        width: 100%;
        box-sizing: border-box;
      }
      .char-search .dropdown {
        position: absolute;
        left: 0;
        right: 0;
        margin: 0.25rem 0 0;
        padding: 0.25rem;
        list-style: none;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        max-height: 220px;
        overflow-y: auto;
        z-index: var(--z-raised);
        box-shadow: 0 12px 28px -16px var(--shadow);
      }
      .char-search .dropdown li {
        padding: 0;
      }
      .char-search .dropdown button {
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        padding: 0.5rem 0.65rem;
        border-radius: 0.5rem;
        color: var(--text-1);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        font-size: 0.85rem;
      }
      .char-search .dropdown button:hover {
        background: var(--bg-surface);
      }
      .char-search .dropdown small {
        color: var(--text-3);
        font-size: 0.7rem;
      }
      .pair-error {
        color: #ff8b8b;
        font-size: 0.78rem;
        margin: 0.4rem 0 0;
      }
      .picked-pills {
        list-style: none;
        margin: 0 0 0.5rem;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .picked-pills li {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.78rem;
      }
      .picked-pills button {
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        padding: 0;
        font-size: 0.85rem;
      }
      .pairing-pills {
        list-style: none;
        margin: 0 0 0.5rem;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .pairing-pills li {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.78rem;
      }
      .pairing-pills button {
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        padding: 0;
        font-size: 0.85rem;
      }
      .romance-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .romance-pills .pill {
        padding: 0.35rem 0.85rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font-size: 0.85rem;
        transition:
          background 120ms ease,
          border-color 120ms ease,
          color 120ms ease;
      }
      .romance-pills .pill:hover {
        border-color: var(--accent);
      }
      .romance-pills .pill.selected {
        background: var(--accent-glow);
        border-color: var(--accent);
        color: var(--accent-text);
      }
      .warning-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
      }
      .warning-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--danger) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--danger) 24%, transparent);
        color: var(--danger);
        font-size: 0.72rem;
      }
      .warning-chip button {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0;
        font-size: 0.72rem;
        min-height: unset;
        opacity: 0.7;
      }
      .warning-chip button:hover {
        opacity: 1;
      }
      @media (max-width: 480px) {
        .actions {
          justify-content: stretch;
        }
        .actions button {
          flex: 1;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedNovelFiltersComponent {
  private readonly languagesService = inject(LanguagesService);
  private readonly warningsService = inject(WarningsService);
  private readonly t = inject(TranslationService);
  private readonly romanceGenresService = inject(RomanceGenresService);
  private readonly charactersService = inject(CharactersService);
  private readonly communityService = inject(CommunityService);
  private readonly destroyRef = inject(DestroyRef);

  readonly fandomOptions = signal<Community[]>([]);

  onNovelTypeChange(value: string): void {
    this.filters.novelType = (value as 'ORIGINAL' | 'FANFIC' | '') || '';
    if (this.filters.novelType !== 'FANFIC') {
      this.filters.fandomSlug = null;
    } else if (this.fandomOptions().length === 0) {
      this.communityService.getCommunities({ type: 'FANDOM', limit: 100 }).subscribe({
        next: (res) => this.fandomOptions.set(res.data ?? []),
        error: () => this.fandomOptions.set([]),
      });
    }
  }

  readonly pairingASuggestions = signal<CharacterSummary[]>([]);
  readonly pairingBSuggestions = signal<CharacterSummary[]>([]);
  readonly pairingADropdownOpen = signal(false);
  readonly pairingBDropdownOpen = signal(false);

  private readonly pairingASearch$ = new Subject<string>();
  private readonly pairingBSearch$ = new Subject<string>();

  @Input() pairingsAllowed = false;

  @Input() set initialFilters(value: NovelFilters) {
    this.filters = { ...value };
    this.tags = value.tags ?? [];
    this.onlyCompleted = value.status === 'COMPLETED';
    this.pairingA = '';
    this.pairingB = '';
    this.pairingsList = (value.pairings ?? [])
      .map((entry) => {
        const [a = '', b = ''] = entry.split('|').map((s) => s.trim());
        return { a, b };
      })
      .filter((p) => p.a || p.b);
    this.selectedRomanceGenreIds = [...(value.romanceGenreIds ?? [])];
    this.selectedWarningIds = [...(value.warningIds ?? [])];
    if (value.novelType === 'FANFIC' && this.fandomOptions().length === 0) {
      this.communityService.getCommunities({ type: 'FANDOM', limit: 100 }).subscribe({
        next: (res) => this.fandomOptions.set(res.data ?? []),
        error: () => this.fandomOptions.set([]),
      });
    }
  }
  @Output() filtersChange = new EventEmitter<NovelFilters>();

  readonly expanded = signal(false);
  readonly languages = signal<LanguageCatalogItem[]>([]);
  readonly romanceGenres = signal<RomanceGenreCatalogItem[]>([]);
  readonly warningsCatalog = signal<CatalogWarningItem[]>([]);

  filters: NovelFilters = {};
  tags: string[] = [];
  onlyCompleted = false;
  pairingA = '';
  pairingB = '';
  pairingsList: { a: string; b: string }[] = [];
  pairingError: string | null = null;
  selectedRomanceGenreIds: string[] = [];
  selectedWarningIds: string[] = [];

  toggleWarning(id: string) {
    this.selectedWarningIds = this.selectedWarningIds.includes(id)
      ? this.selectedWarningIds.filter((v) => v !== id)
      : [...this.selectedWarningIds, id];
  }

  onWarningSelect(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    if (id && !this.selectedWarningIds.includes(id)) {
      this.selectedWarningIds = [...this.selectedWarningIds, id];
    }
    (event.target as HTMLSelectElement).value = '';
  }

  getWarningLabel(id: string): string {
    return this.warningsCatalog().find((w) => w.id === id)?.label ?? id;
  }

  availableWarnings() {
    return this.warningsCatalog().filter((w) => !this.selectedWarningIds.includes(w.id));
  }

  toggleRomanceGenre(id: string) {
    this.selectedRomanceGenreIds = this.selectedRomanceGenreIds.includes(id)
      ? this.selectedRomanceGenreIds.filter((v) => v !== id)
      : [...this.selectedRomanceGenreIds, id];
  }

  onPairingAChange(value: string) {
    this.pairingA = value;
    this.pairingADropdownOpen.set(true);
    this.pairingASearch$.next(value);
  }

  onPairingBChange(value: string) {
    this.pairingB = value;
    this.pairingBDropdownOpen.set(true);
    this.pairingBSearch$.next(value);
  }

  selectPairingA(name: string) {
    this.pairingA = name;
    this.pairingADropdownOpen.set(false);
    this.pairingASuggestions.set([]);
  }

  selectPairingB(name: string) {
    this.pairingB = name;
    this.pairingBDropdownOpen.set(false);
    this.pairingBSuggestions.set([]);
  }

  addPairingEntry() {
    this.pairingError = null;
    const a = this.pairingA.trim();
    const b = this.pairingB.trim();
    if (!a || !b) {
      this.pairingError = 'Debes seleccionar 2 personajes para la pareja.';
      return;
    }
    if (a.toLowerCase() === b.toLowerCase()) {
      this.pairingError = 'No puedes seleccionar el mismo personaje dos veces.';
      return;
    }
    // Avoid exact duplicates (in any order, case-insensitive)
    const exists = this.pairingsList.some(
      (p) =>
        (p.a.toLowerCase() === a.toLowerCase() && p.b.toLowerCase() === b.toLowerCase()) ||
        (p.a.toLowerCase() === b.toLowerCase() && p.b.toLowerCase() === a.toLowerCase()),
    );
    if (exists) {
      this.pairingError = 'Esta pareja ya está en el filtro.';
      return;
    }
    this.pairingsList = [...this.pairingsList, { a, b }];
    this.pairingA = '';
    this.pairingB = '';
  }

  removePairingEntry(index: number) {
    this.pairingsList = this.pairingsList.filter((_, i) => i !== index);
  }

  sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'recently_updated', label: 'Actualizadas recientemente' },
    { value: 'most_voted', label: 'Más votadas' },
    { value: 'most_kudos', label: 'Más kudos' },
    { value: 'most_chapters', label: 'Más capítulos' },
    { value: 'most_words', label: 'Más palabras' },
  ];

  get ratingOptions() {
    return [
      { value: null, label: 'Todas' },
      ...['G', 'PG', 'T', 'R', 'EXPLICIT'].map((r) => ({
        value: r,
        label: this.t.translate('novel.rating.' + r),
      })),
    ];
  }

  constructor() {
    this.languagesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (languages) => this.languages.set(languages),
      error: () => this.languages.set([]),
    });
    this.romanceGenresService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (genres) => this.romanceGenres.set(genres),
      error: () => this.romanceGenres.set([]),
    });
    this.warningsService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => this.warningsCatalog.set(items),
      error: () => this.warningsCatalog.set([]),
    });

    this.pairingASearch$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          const t = term.trim();
          if (t.length < 2) {
            this.pairingASuggestions.set([]);
            return [];
          }
          return this.charactersService.listPublic({ search: t, limit: 10 });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => this.pairingASuggestions.set(response.data ?? []),
        error: () => this.pairingASuggestions.set([]),
      });

    this.pairingBSearch$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          const t = term.trim();
          if (t.length < 2) {
            this.pairingBSuggestions.set([]);
            return [];
          }
          return this.charactersService.listPublic({ search: t, limit: 10 });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => this.pairingBSuggestions.set(response.data ?? []),
        error: () => this.pairingBSuggestions.set([]),
      });
  }

  get activeCount(): number {
    let count = 0;
    if (this.filters.languageId) count++;
    if (this.filters.updatedAfter) count++;
    if (this.filters.updatedBefore) count++;
    if (this.tags.length) count++;
    if (this.onlyCompleted) count++;
    if (this.selectedRomanceGenreIds.length) count++;
    if (this.selectedWarningIds.length) count++;
    if (this.pairingsList.length) count++;
    if (this.filters.sortBy && this.filters.sortBy !== 'newest') count++;
    if (this.filters.rating) count++;
    if (this.filters.novelType) count++;
    if (this.filters.fandomSlug) count++;
    return count;
  }

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  apply(): void {
    // Auto-commit any pending pair input the user filled but didn't click "+ Añadir"
    if (this.pairingsAllowed && (this.pairingA.trim() || this.pairingB.trim())) {
      this.addPairingEntry();
    }
    const pairings = this.pairingsAllowed
      ? this.pairingsList.map((p) => `${p.a}|${p.b}`).filter((entry) => entry !== '|')
      : [];
    const out: NovelFilters = {
      ...this.filters,
      tags: this.tags.length ? this.tags : undefined,
      status: this.onlyCompleted ? 'COMPLETED' : this.filters.status || undefined,
      rating: this.filters.rating || undefined,
      romanceGenreIds: this.selectedRomanceGenreIds.length
        ? [...this.selectedRomanceGenreIds]
        : undefined,
      warningIds: this.selectedWarningIds.length ? [...this.selectedWarningIds] : undefined,
      pairings: pairings.length ? pairings : undefined,
      novelType: this.filters.novelType || undefined,
      fandomSlug:
        this.filters.novelType === 'FANFIC' ? this.filters.fandomSlug || undefined : undefined,
    };
    this.filtersChange.emit(out);
  }

  clear(): void {
    this.filters = { languageId: null };
    this.tags = [];
    this.onlyCompleted = false;
    this.pairingA = '';
    this.pairingB = '';
    this.pairingsList = [];
    this.pairingError = null;
    this.selectedRomanceGenreIds = [];
    this.selectedWarningIds = [];
    this.filtersChange.emit({});
  }
}
