import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { CharacterSummary } from '../../core/models/character.model';
import { Genre } from '../../core/models/genre.model';
import { LanguageCatalogItem } from '../../core/models/language.model';
import { NovelRating, NovelStatus, NovelType } from '../../core/models/novel.model';
import { RomanceGenreCatalogItem } from '../../core/models/romance-genre.model';
import { RomanceGenresService } from '../../core/services/romance-genres.service';
import { WarningsService } from '../../core/services/warnings.service';
import { CatalogWarningItem } from '../../core/models/warning.model';
import { Community } from '../communities/models/community.model';
import { CommunityService } from '../communities/services/community.service';
import { CommunityCharactersService } from '../communities/services/community-characters.service';
import { CommunityCharacter } from '../communities/models/community-character.model';
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
import { NovelFormGenreSelectorComponent } from './components/novel-form/novel-form-genre-selector.component';
import { NovelFormWarningsSelectorComponent } from './components/novel-form/novel-form-warnings-selector.component';
import {
  NovelFormCharacterPairingsComponent,
  PairingDraft,
} from './components/novel-form/novel-form-character-pairings.component';
import { NovelFormFanficSectionComponent } from './components/novel-form/novel-form-fanfic-section.component';

@Component({
  selector: 'app-novel-form-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TagChipsInputComponent,
    NovelFormGenreSelectorComponent,
    NovelFormWarningsSelectorComponent,
    NovelFormCharacterPairingsComponent,
    NovelFormFanficSectionComponent,
  ],
  template: `
    <section class="form-shell">
      <h1>{{ isEdit() ? 'Editar novela' : 'Nueva novela' }}</h1>

      <div class="form-grid">
        <fieldset class="full novel-type-fieldset">
          <legend>Tipo de novela</legend>
          @if (isEdit()) {
            <p class="hint">
              {{ novelType === 'FANFIC' ? 'Fanfic' : 'Original' }} ·
              <em>El tipo no se puede cambiar tras la creación.</em>
            </p>
          } @else {
            <div class="type-options">
              <label class="type-opt">
                <input
                  type="radio"
                  name="novelType"
                  value="ORIGINAL"
                  [checked]="novelType === 'ORIGINAL'"
                  (change)="setNovelType('ORIGINAL')"
                  [disabled]="saving()"
                />
                <span>
                  <strong>Original</strong>
                  <small>Una historia creada completamente por ti.</small>
                </span>
              </label>
              <label class="type-opt">
                <input
                  type="radio"
                  name="novelType"
                  value="FANFIC"
                  [checked]="novelType === 'FANFIC'"
                  (change)="setNovelType('FANFIC')"
                  [disabled]="saving()"
                />
                <span>
                  <strong>Fanfic</strong>
                  <small>Una historia basada en un universo o fandom existente.</small>
                </span>
              </label>
            </div>
          }
        </fieldset>

        @if (novelType === 'FANFIC') {
          <app-novel-form-fanfic-section
            #fanficSection
            [myFandoms]="myFandoms()"
            [linkedCommunityId]="linkedCommunityId"
            [linkedCommunityName]="linkedCommunityName()"
            [isEdit]="isEdit()"
            [isAlternateUniverse]="isAlternateUniverse"
            [validationError]="fanficValidationError()"
            [disabled]="saving()"
            (communityChange)="onLinkedCommunityChange($event)"
            (alternateUniverseChange)="isAlternateUniverse = $event"
          />
        }

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

        <fieldset class="full genres">
          <legend>Generos del romance</legend>
          <div class="genre-picker">
            <select
              [disabled]="saving() || !availableRomanceGenres().length"
              [ngModel]="''"
              (ngModelChange)="toggleRomanceGenre($event)"
            >
              <option value="" disabled>
                @if (!availableRomanceGenres().length) {
                  No quedan generos por agregar
                } @else {
                  Seleccionar genero de romance
                }
              </option>
              @for (g of availableRomanceGenres(); track g.id) {
                <option [value]="g.id">{{ g.label }}</option>
              }
            </select>
            @if (selectedRomanceGenreIds().length) {
              <ul class="picked-list">
                @for (id of selectedRomanceGenreIds(); track id) {
                  <li>
                    {{ getRomanceGenreLabel(id) }}
                    <button
                      type="button"
                      class="icon"
                      [disabled]="saving()"
                      aria-label="Quitar genero"
                      (click)="toggleRomanceGenre(id)"
                    >
                      ✕
                    </button>
                  </li>
                }
              </ul>
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

        <fieldset class="full genres">
          <legend>Tags</legend>
          <div class="genre-picker">
            <app-tag-chips-input
              [tags]="tagList()"
              [maxTags]="20"
              placeholder="Escribir tag y presionar Enter"
              (tagsChange)="onTagsChange($event)"
            />
          </div>
        </fieldset>

        <app-novel-form-warnings-selector
          [allWarnings]="warningsCatalog()"
          [selectedWarningIds]="selectedWarningIds()"
          [disabled]="saving()"
          (warningsChange)="selectedWarningIds.set($event)"
        />

        <app-novel-form-genre-selector
          [allGenres]="genres()"
          [selectedGenreIds]="selectedGenreIds()"
          [maxGenres]="5"
          [disabled]="saving()"
          (genresChange)="selectedGenreIds.set($event)"
        />

        @if (novelType !== 'FANFIC') {
          <app-novel-form-character-pairings
            #charPairings
            [characters]="characters()"
            [selectedCharacterIds]="selectedCharacterIds()"
            [pairings]="pairings()"
            [disabled]="saving()"
            (characterIdsChange)="selectedCharacterIds.set($event)"
            (pairingsChange)="pairings.set($event)"
          />
        }

        @if (novelType === 'FANFIC') {
          <fieldset class="full linked-block">
            <legend>Parejas</legend>
            @if (fanficPairOptions().length < 2) {
              <p class="hint">
                Agrega al menos 2 personajes (catálogo o texto libre) para crear parejas.
              </p>
            } @else {
              <div class="pairing-section">
                <h4>Parejas principales</h4>
                @if (fanficMainPairs().length) {
                  <ul class="pairings-list">
                    @for (p of fanficMainPairs(); track $index) {
                      <li>
                        <span class="pair-label">{{ p.a }} × {{ p.b }}</span>
                        <button type="button" class="icon" (click)="removeFanficMainPair(p)">
                          ✕
                        </button>
                      </li>
                    }
                  </ul>
                }
                <div class="pairing-form">
                  <select [(ngModel)]="fanficMainA" name="fanficMainA">
                    <option [ngValue]="null">Personaje 1</option>
                    @for (n of fanficPairOptions(); track n) {
                      <option [ngValue]="n">{{ n }}</option>
                    }
                  </select>
                  <span>×</span>
                  <select [(ngModel)]="fanficMainB" name="fanficMainB">
                    <option [ngValue]="null">Personaje 2</option>
                    @for (n of fanficPairOptions(); track n) {
                      <option [ngValue]="n">{{ n }}</option>
                    }
                  </select>
                  <button type="button" (click)="addFanficMainPair()">Añadir</button>
                </div>
                @if (fanficMainPairError()) {
                  <p class="pair-error">{{ fanficMainPairError() }}</p>
                }
              </div>

              <div class="pairing-section">
                <h4>Parejas secundarias</h4>
                @if (fanficSecondaryPairs().length) {
                  <ul class="pairings-list">
                    @for (p of fanficSecondaryPairs(); track $index) {
                      <li>
                        <span class="pair-label">{{ p.a }} × {{ p.b }}</span>
                        <button type="button" class="icon" (click)="removeFanficSecondaryPair(p)">
                          ✕
                        </button>
                      </li>
                    }
                  </ul>
                }
                <div class="pairing-form">
                  <select [(ngModel)]="fanficSecA" name="fanficSecA">
                    <option [ngValue]="null">Personaje 1</option>
                    @for (n of fanficPairOptions(); track n) {
                      <option [ngValue]="n">{{ n }}</option>
                    }
                  </select>
                  <span>×</span>
                  <select [(ngModel)]="fanficSecB" name="fanficSecB">
                    <option [ngValue]="null">Personaje 2</option>
                    @for (n of fanficPairOptions(); track n) {
                      <option [ngValue]="n">{{ n }}</option>
                    }
                  </select>
                  <button type="button" (click)="addFanficSecondaryPair()">Añadir</button>
                </div>
                @if (fanficSecPairError()) {
                  <p class="pair-error">{{ fanficSecPairError() }}</p>
                }
              </div>
            }
          </fieldset>
        }

        @if (canLinkWorlds()) {
          <fieldset class="full genres">
            <legend>Mundos vinculados</legend>
            @if (!worlds().length) {
              <p class="hint">Aun no tienes mundos creados. Puedes gestionarlos en Mis mundos.</p>
            } @else {
              <div class="genre-picker">
                <select
                  [disabled]="saving() || !availableWorlds().length"
                  [ngModel]="''"
                  (ngModelChange)="selectWorld($event)"
                >
                  <option value="" disabled>
                    @if (!availableWorlds().length) {
                      No quedan mundos por vincular
                    } @else {
                      Selecciona un mundo
                    }
                  </option>
                  @for (world of availableWorlds(); track world.id) {
                    <option [value]="world.id">{{ world.name }}</option>
                  }
                </select>
                @if (selectedWorlds().length) {
                  <ul class="picked-list">
                    @for (world of selectedWorlds(); track world.id) {
                      <li>
                        {{ world.name }}
                        <button
                          type="button"
                          class="icon"
                          [disabled]="saving()"
                          aria-label="Quitar mundo"
                          (click)="removeWorld(world.id)"
                        >
                          ✕
                        </button>
                      </li>
                    }
                  </ul>
                }
              </div>
            }
          </fieldset>
        }

        @if (novelType === 'FANFIC') {
          <fieldset class="full linked-block">
            <legend>Personajes</legend>
            <p class="hint">
              Agrega personajes en texto libre. Se guardarán como tags y estarán disponibles para
              crear parejas.
            </p>
            <app-tag-chips-input
              [tags]="customCharacterList()"
              [maxTags]="30"
              placeholder="Nombre del personaje y Enter..."
              (tagsChange)="onCustomCharactersChange($event)"
            />
          </fieldset>
        }

        @if (novelType === 'FANFIC' && linkedCommunityId) {
          <fieldset class="full linked-block">
            <legend>Personajes del catálogo</legend>
            @if (catalogLoading()) {
              <p class="hint">Cargando catálogo...</p>
            } @else if (!catalogCharacters().length) {
              <p class="hint">Este fandom aún no tiene personajes en su catálogo.</p>
            } @else {
              <div class="linked-selector">
                <select
                  [ngModel]="pendingCatalogCharacterId"
                  (ngModelChange)="addCatalogCharacter($event)"
                  name="pendingCatalogCharacterId"
                  [disabled]="saving()"
                >
                  <option [ngValue]="''">Selecciona un personaje</option>
                  @for (cc of availableCatalogCharacters(); track cc.id) {
                    <option [ngValue]="cc.id">{{ cc.name }}</option>
                  }
                </select>
              </div>
              @if (selectedCommunityCharacterIds().length) {
                <div class="selected-items">
                  @for (cc of selectedCatalogCharacters(); track cc.id) {
                    <button
                      type="button"
                      class="linked-pill"
                      [disabled]="saving()"
                      (click)="toggleCommunityCharacter(cc.id)"
                    >
                      <span>{{ cc.name }}</span>
                      <strong>×</strong>
                    </button>
                  }
                </div>
              } @else {
                <p class="hint">Aún no has añadido personajes del catálogo.</p>
              }
            }
          </fieldset>
        }

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
              <div class="coll-actions">
                <button type="button" (click)="createCollectionAndAdd()">Agregar</button>
                <button type="button" (click)="showCreateColl.set(false)">Cancelar</button>
              </div>
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
      input:focus,
      textarea:focus,
      select:focus {
        outline: none;
        border-color: var(--accent);
      }
      input::placeholder,
      textarea::placeholder {
        color: var(--text-3);
      }
      label {
        color: var(--text-2);
      }
      h1 {
        color: var(--text-1);
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

      .genres .genre-picker {
        display: flex;
        flex-direction: column-reverse;
        gap: 0.5rem;
      }
      .genres .genre-picker select {
        width: 100%;
      }
      .genres .genre-picker .hint {
        order: -1;
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
      .hint a {
        color: var(--accent-text);
        text-decoration: none;
      }
      .hint a:hover {
        color: var(--accent);
      }

      .error {
        margin: 0;
        color: var(--danger);
      }

      .status {
        margin: 0;
        color: var(--accent-text);
        padding: 0.75rem 0.9rem;
        border-radius: 0.9rem;
        background: var(--accent-glow);
      }

      .status.success {
        background: var(--accent-glow);
        color: var(--accent-text);
      }

      .pairing-section {
        display: grid;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .pairing-section h4 {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-2);
      }
      .romance-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .romance-pills .pill {
        padding: 0.4rem 0.9rem;
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
      .romance-pills .pill:hover:not(:disabled) {
        border-color: var(--accent);
      }
      .romance-pills .pill.selected {
        background: var(--accent-glow);
        border-color: var(--accent);
        color: var(--accent-text);
      }
      .romance-pills .pill:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .warning-list li {
        background: color-mix(in srgb, var(--danger) 12%, transparent);
        border-color: color-mix(in srgb, var(--danger) 24%, transparent);
        color: var(--danger);
      }
      .warning-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .warning-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--danger) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--danger) 24%, transparent);
        color: var(--danger);
        font-size: 0.78rem;
      }
      .warning-chip button {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0;
        font-size: 0.78rem;
        min-height: unset;
        opacity: 0.7;
      }
      .warning-chip button:hover {
        opacity: 1;
      }
      .pairing-form {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .pairing-form select {
        flex: 1;
        min-width: 120px;
      }
      .pairing-form span {
        color: var(--text-2);
        font-weight: bold;
      }
      .create-coll-form {
        display: grid;
        gap: 0.6rem;
        margin-top: 0.5rem;
      }
      .create-coll-form input,
      .create-coll-form select,
      .create-coll-form textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 0.6rem 0.8rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        font: inherit;
      }
      .create-coll-form textarea {
        min-height: 80px;
        resize: vertical;
      }
      .create-coll-form .coll-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
      }
      .create-coll-form button {
        justify-self: start;
        width: auto;
        padding: 0.5rem 1rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
        font: inherit;
      }
      .pairing-row,
      .pairings-list li {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.6rem;
        background: var(--accent-glow);
        color: var(--accent-text);
        border-radius: 999px;
        gap: 0.35rem;
        font-size: 0.8rem;
        width: auto;
        line-height: 1;
      }
      .pairing-row .icon,
      .pairings-list li .icon {
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0;
        width: 1rem;
        height: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        line-height: 1;
      }
      .pairings-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .pair-label {
        font-weight: 600;
      }
      .pair-error {
        color: var(--danger);
        font-size: 0.8rem;
        margin: 0.4rem 0 0;
      }

      .novel-type-fieldset .type-options {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .type-opt {
        display: flex;
        gap: 0.6rem;
        flex: 1;
        min-width: 220px;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--bg-surface);
        cursor: pointer;
      }
      .type-opt small {
        display: block;
        color: var(--text-3);
        font-size: 0.78rem;
        margin-top: 0.2rem;
      }
      .catalog-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.4rem;
      }
      .catalog-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.4rem 0.6rem;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        background: var(--bg-surface);
        cursor: pointer;
      }
      .cc-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--bg-card);
        overflow: hidden;
        display: grid;
        place-items: center;
      }
      .cc-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      @media (max-width: 700px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovelFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly novelsService = inject(NovelsService);
  private readonly genresService = inject(GenresService);
  private readonly languagesService = inject(LanguagesService);
  private readonly romanceGenresService = inject(RomanceGenresService);
  private readonly warningsService = inject(WarningsService);
  private readonly charactersService = inject(CharactersService);
  private readonly authService = inject(AuthService);
  private readonly worldsService = inject(WorldsService);
  private readonly seriesService = inject(SeriesService);
  private readonly communityService = inject(CommunityService);
  private readonly communityCharactersService = inject(CommunityCharactersService);
  private readonly destroyRef = inject(DestroyRef);

  novelType: NovelType = 'ORIGINAL';
  linkedCommunityId = '';
  customFandom = '';
  readonly customCharacterList = signal<string[]>([]);
  onCustomCharactersChange(tags: string[]): void {
    this.customCharacterList.set(tags);
  }
  readonly myFandoms = signal<Community[]>([]);
  readonly catalogCharacters = signal<CommunityCharacter[]>([]);
  readonly catalogLoading = signal(false);
  readonly selectedCommunityCharacterIds = signal<string[]>([]);
  readonly initialCommunityCharacterIds = signal<string[]>([]);
  readonly fanficValidationError = signal<string | null>(null);
  private linkedCommunitySlug: string | null = null;

  linkedCommunityName(): string {
    const id = this.linkedCommunityId;
    return this.myFandoms().find((c) => c.id === id)?.name ?? '';
  }

  canLinkWorlds(): boolean {
    return (
      this.novelType === 'ORIGINAL' || (this.novelType === 'FANFIC' && this.isAlternateUniverse)
    );
  }

  setNovelType(type: NovelType): void {
    this.novelType = type;
    this.fanficValidationError.set(null);
    if (type === 'ORIGINAL') {
      this.isAlternateUniverse = false;
      this.linkedCommunityId = '';
      this.linkedCommunitySlug = null;
      this.catalogCharacters.set([]);
      this.selectedCommunityCharacterIds.set([]);
    }
  }

  onLinkedCommunityChange(communityId: string): void {
    this.linkedCommunityId = communityId;
    this.fanficValidationError.set(null);
    const com = this.myFandoms().find((c) => c.id === communityId);
    this.linkedCommunitySlug = com?.slug ?? null;
    this.catalogCharacters.set([]);
    this.selectedCommunityCharacterIds.set([]);
    if (com) {
      this.loadCatalog(com.slug);
    }
  }

  private loadCatalog(slug: string): void {
    this.catalogLoading.set(true);
    this.communityCharactersService.list(slug, { status: 'ACTIVE' }).subscribe({
      next: (list) => {
        this.catalogCharacters.set(list);
        this.catalogLoading.set(false);
      },
      error: () => {
        this.catalogCharacters.set([]);
        this.catalogLoading.set(false);
      },
    });
  }

  toggleCommunityCharacter(id: string): void {
    this.selectedCommunityCharacterIds.update((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  pendingCatalogCharacterId = '';
  readonly availableCatalogCharacters = computed(() => {
    const taken = new Set(this.selectedCommunityCharacterIds());
    return this.catalogCharacters().filter((c) => !taken.has(c.id));
  });
  readonly selectedCatalogCharacters = computed(() => {
    const ids = this.selectedCommunityCharacterIds();
    return this.catalogCharacters().filter((c) => ids.includes(c.id));
  });
  addCatalogCharacter(id: string): void {
    if (!id) return;
    if (!this.selectedCommunityCharacterIds().includes(id)) {
      this.selectedCommunityCharacterIds.update((list) => [...list, id]);
    }
    this.pendingCatalogCharacterId = '';
  }

  readonly genres = signal<Genre[]>([]);
  readonly characters = signal<CharacterSummary[]>([]);
  readonly worlds = signal<WorldSummary[]>([]);
  readonly languages = signal<LanguageCatalogItem[]>([]);
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

  readonly novelId = signal<string | null>(null);
  readonly collections = signal<SeriesDetail[]>([]);
  readonly showCreateColl = signal(false);
  newCollTitle = '';
  newCollType: SeriesType = 'SAGA';
  newCollDescription = '';

  readonly statusOptions: NovelStatus[] = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];
  readonly ratingOptions: NovelRating[] = ['G', 'PG', 'T', 'R', 'EXPLICIT'];

  slug: string | null = null;
  title = '';
  synopsis = '';
  status: NovelStatus = 'DRAFT';
  rating: NovelRating = 'G';
  languageId = '';
  isAlternateUniverse = false;
  readonly tagList = signal<string[]>([]);
  readonly warningList = signal<string[]>([]);
  readonly warningsCatalog = signal<CatalogWarningItem[]>([]);
  readonly selectedWarningIds = signal<string[]>([]);

  onTagsChange(tags: string[]) {
    this.tagList.set(tags);
  }

  onWarningsChange(warnings: string[]) {
    this.warningList.set(warnings);
  }
  isPublic = false;
  pendingWorldId = '';

  readonly selectedRomanceGenreIds = signal<string[]>([]);
  readonly romanceGenreOptions = signal<RomanceGenreCatalogItem[]>([]);

  toggleRomanceGenre(id: string) {
    this.selectedRomanceGenreIds.update((list) =>
      list.includes(id) ? list.filter((v) => v !== id) : [...list, id],
    );
  }

  availableRomanceGenres() {
    const taken = new Set(this.selectedRomanceGenreIds());
    return this.romanceGenreOptions().filter((g) => !taken.has(g.id));
  }

  getRomanceGenreLabel(id: string): string {
    return this.romanceGenreOptions().find((g) => g.id === id)?.label ?? id;
  }

  readonly pairings = signal<PairingDraft[]>([]);

  // Fanfic string-based pairings (saved as tags "a/b").
  readonly fanficMainPairs = signal<{ a: string; b: string }[]>([]);
  readonly fanficSecondaryPairs = signal<{ a: string; b: string }[]>([]);
  readonly fanficMainPairError = signal<string | null>(null);
  readonly fanficSecPairError = signal<string | null>(null);
  fanficMainA: string | null = null;
  fanficMainB: string | null = null;
  fanficSecA: string | null = null;
  fanficSecB: string | null = null;

  readonly fanficPairOptions = computed(() => {
    const set = new Set<string>();
    for (const n of this.customCharacterList()) {
      const t = n.trim();
      if (t) set.add(t);
    }
    for (const c of this.catalogCharacters()) {
      if (c.name) set.add(c.name);
    }
    return Array.from(set);
  });

  addFanficMainPair() {
    this.fanficMainPairError.set(null);
    if (!this.fanficMainA || !this.fanficMainB) {
      this.fanficMainPairError.set('Selecciona 2 personajes.');
      return;
    }
    if (this.fanficMainA.trim().toLowerCase() === this.fanficMainB.trim().toLowerCase()) {
      this.fanficMainPairError.set('No puedes seleccionar el mismo personaje dos veces.');
      return;
    }
    const a = this.fanficMainA;
    const b = this.fanficMainB;
    const norm = (s: string) => s.trim().toLowerCase();
    const exists = this.fanficMainPairs().some(
      (p) =>
        (norm(p.a) === norm(a) && norm(p.b) === norm(b)) ||
        (norm(p.a) === norm(b) && norm(p.b) === norm(a)),
    );
    if (exists) {
      this.fanficMainPairError.set('Esta pareja ya existe.');
      return;
    }
    this.fanficMainPairs.update((list) => [...list, { a, b }]);
    this.fanficMainA = null;
    this.fanficMainB = null;
  }

  removeFanficMainPair(p: { a: string; b: string }) {
    this.fanficMainPairs.update((list) => list.filter((x) => x !== p));
  }

  addFanficSecondaryPair() {
    this.fanficSecPairError.set(null);
    if (!this.fanficSecA || !this.fanficSecB) {
      this.fanficSecPairError.set('Selecciona 2 personajes.');
      return;
    }
    if (this.fanficSecA.trim().toLowerCase() === this.fanficSecB.trim().toLowerCase()) {
      this.fanficSecPairError.set('No puedes seleccionar el mismo personaje dos veces.');
      return;
    }
    const a = this.fanficSecA;
    const b = this.fanficSecB;
    const exists = this.fanficSecondaryPairs().some(
      (p) => (p.a === a && p.b === b) || (p.a === b && p.b === a),
    );
    const isMain = this.fanficMainPairs().some(
      (p) => (p.a === a && p.b === b) || (p.a === b && p.b === a),
    );
    if (isMain) {
      this.fanficSecPairError.set('Esa pareja ya es principal.');
      return;
    }
    if (exists) {
      this.fanficSecPairError.set('Esta pareja ya existe.');
      return;
    }
    this.fanficSecondaryPairs.update((list) => [...list, { a, b }]);
    this.fanficSecA = null;
    this.fanficSecB = null;
  }

  removeFanficSecondaryPair(p: { a: string; b: string }) {
    this.fanficSecondaryPairs.update((list) => list.filter((x) => x !== p));
  }

  ngOnInit() {
    this.genresService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((genres) => this.genres.set(genres.filter((g) => g.slug !== 'fanfiction')));
    this.languagesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (languages) => {
        this.languages.set(languages);
        if (!this.languageId) {
          this.languageId =
            languages.find((language) => language.code === 'es')?.id ?? languages[0]?.id ?? '';
        }
      },
      error: () => this.languages.set([]),
    });
    this.romanceGenresService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (genres) => this.romanceGenreOptions.set(genres),
      error: () => this.romanceGenreOptions.set([]),
    });
    this.warningsService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => this.warningsCatalog.set(items),
      error: () => this.warningsCatalog.set([]),
    });
    this.charactersService.listMine({ limit: 50, sort: 'updated' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.characters.set(response.data),
      error: () => this.characters.set([]),
    });
    this.worldsService.listMine({ limit: 50, sort: 'updated' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.worlds.set(response.data),
      error: () => this.worlds.set([]),
    });
    this.communityService.getMyCommunities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (list) => {
        const fandoms = list.filter((c) => c.type === 'FANDOM' && c.status === 'ACTIVE');
        this.myFandoms.set(fandoms);
      },
      error: () => this.myFandoms.set([]),
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.slug = params.get('slug');
      this.isEdit.set(Boolean(this.slug));

      if (!this.slug) {
        return;
      }

      this.novelsService.getBySlug(this.slug).subscribe((novel) => {
        this.novelId.set(novel.id);
        this.novelType = (novel.novelType as NovelType) ?? 'ORIGINAL';
        this.isAlternateUniverse = Boolean(novel.isAlternateUniverse);
        this.linkedCommunityId = novel.linkedCommunityId ?? '';
        this.linkedCommunitySlug = novel.linkedCommunity?.slug ?? null;
        if (novel.linkedCommunity && this.linkedCommunityId) {
          // Make sure it's in myFandoms list so the label resolves
          const exists = this.myFandoms().some((c) => c.id === novel.linkedCommunityId);
          if (!exists) {
            this.myFandoms.update((list) => [
              ...list,
              {
                id: novel.linkedCommunity!.id,
                slug: novel.linkedCommunity!.slug,
                name: novel.linkedCommunity!.name,
                type: 'FANDOM',
                status: 'ACTIVE',
                description: null,
                coverUrl: null,
                bannerUrl: null,
                rules: null,
                rejectionReason: null,
                membersCount: 0,
                followersCount: 0,
                owner: null,
                linkedNovel: null,
                relatedNovels: [],
                isMember: false,
                isFollowing: false,
                isOwner: false,
                isFollowingOwner: false,
                forums: [],
                createdAt: '',
                updatedAt: '',
              } as Community,
            ]);
          }
          if (this.linkedCommunitySlug) {
            this.loadCatalog(this.linkedCommunitySlug);
          }
        }
        const initialCC = (novel.communityCharacters ?? []).map((cc) => cc.id);
        this.selectedCommunityCharacterIds.set(initialCC);
        this.initialCommunityCharacterIds.set(initialCC);
        this.loadCollections();
        this.title = novel.title;
        this.synopsis = novel.synopsis || '';
        this.status = novel.status;
        this.rating = novel.rating;
        this.languageId = novel.languageId;
        this.tagList.set(novel.tags ?? []);
        this.warningList.set([]);
        this.selectedWarningIds.set(
          (novel.warnings ?? []).map((w: string | { id: string }) =>
            typeof w === 'string' ? w : w.id,
          ),
        );
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
        this.selectedRomanceGenreIds.set(novel.romanceGenres?.map((rg) => rg.id) ?? []);
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

  @ViewChild('charPairings') charPairingsRef?: NovelFormCharacterPairingsComponent;
  @ViewChild('fanficSection') fanficSectionRef?: NovelFormFanficSectionComponent;

  save() {
    if (this.saving() || !this.title.trim() || !this.languageId) {
      return;
    }

    // Auto-commit any pending pair selections that the user filled but didn't click "Definir/Añadir"
    if (this.charPairingsRef) {
      const result = this.charPairingsRef.autoCommitPendingPairs();
      if (result.mainError || result.secondaryError) {
        return;
      }
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('');

    const customFandomTag = this.fanficSectionRef?.getCustomFandom() ?? this.customFandom.trim();
    if (
      !this.isEdit() &&
      this.novelType === 'FANFIC' &&
      !this.linkedCommunityId &&
      !customFandomTag
    ) {
      this.fanficValidationError.set(
        'Selecciona una comunidad fandom o escribe el nombre del fandom.',
      );
      this.saving.set(false);
      return;
    }

    // Merge the custom fandom name into the tag list when used.
    const tags = this.tagList();
    if (customFandomTag && !tags.includes(customFandomTag)) {
      tags.push(customFandomTag);
    }
    if (this.novelType === 'FANFIC') {
      for (const name of this.customCharacterList()) {
        const t = name.trim();
        if (t && !tags.includes(t)) tags.push(t);
      }
      const slugify = (s: string) =>
        s
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
      const pushPair = (a: string, b: string) => {
        const tag = `${slugify(a)}/${slugify(b)}`;
        if (tag.length > 1 && !tags.includes(tag)) tags.push(tag);
      };
      for (const p of this.fanficMainPairs()) pushPair(p.a, p.b);
      for (const p of this.fanficSecondaryPairs()) pushPair(p.a, p.b);
    }

    const payload: Parameters<NovelsService['create']>[0] = {
      title: this.title,
      synopsis: this.synopsis || null,
      status: this.status,
      rating: this.rating,
      languageId: this.languageId,
      tags,
      warnings: this.warningList(),
      warning_ids: this.selectedWarningIds(),
      genreIds: this.selectedGenreIds(),
      isPublic: this.isEdit() ? this.isPublic : false,
      romanceGenreIds: this.selectedRomanceGenreIds(),
      pairings: this.pairings(),
      isAlternateUniverse: this.isAlternateUniverse,
    };

    if (!this.isEdit()) {
      payload.novelType = this.novelType;
      if (this.novelType === 'FANFIC') {
        payload.linkedCommunityId = this.linkedCommunityId || null;
      }
    }

    const request = this.slug
      ? this.novelsService.update(this.slug, payload)
      : this.novelsService.create(payload);

    request
      .pipe(
        switchMap((novel) => this.syncCharacterLinks(novel.slug, novel)),
        switchMap((novel) => this.syncWorldLinks(novel.slug, novel)),
        switchMap((novel) => this.syncCommunityCharacterLinks(novel.slug, novel)),
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
          const e = err as {
            error?: { error?: { message?: string }; message?: string };
            message?: string;
          };
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

  private syncCommunityCharacterLinks(novelSlug: string, novel: { slug: string }) {
    if (this.novelType !== 'FANFIC') return of(novel);
    const selected = new Set(this.selectedCommunityCharacterIds());
    const initial = new Set(this.initialCommunityCharacterIds());
    const toLink = [...selected].filter((id) => !initial.has(id));
    const toUnlink = [...initial].filter((id) => !selected.has(id));
    const operations = [
      ...toLink.map((id) => this.novelsService.linkCommunityCharacter(novelSlug, id)),
      ...toUnlink.map((id) => this.novelsService.unlinkCommunityCharacter(novelSlug, id)),
    ];
    return operations.length ? forkJoin(operations).pipe(switchMap(() => of(novel))) : of(novel);
  }

  private syncWorldLinks(novelSlug: string, novel: { slug: string }) {
    if (!this.canLinkWorlds()) {
      this.selectedWorldIds.set([]);
      return of(novel);
    }

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
