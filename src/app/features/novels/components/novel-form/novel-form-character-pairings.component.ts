import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CharacterSummary } from '../../../../core/models/character.model';

export interface PairingDraft {
  characterAId: string;
  characterBId: string;
  isMain: boolean;
}

@Component({
  selector: 'app-novel-form-character-pairings',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="full linked-block">
      <legend>Personajes vinculados</legend>
      @if (!characters.length) {
        <p class="hint">
          Aun no tienes personajes creados. Puedes gestionarlos en
          <a routerLink="/mis-personajes">Mis personajes</a>.
        </p>
      } @else {
        <div class="char-search">
          <input
            type="text"
            [(ngModel)]="characterSearch"
            [disabled]="disabled"
            placeholder="Buscar personaje por nombre..."
            (focus)="charDropdownOpen.set(true)"
          />
          @if (charDropdownOpen() && filteredChars().length) {
            <ul class="char-dropdown">
              @for (character of filteredChars(); track character.id) {
                <li>
                  <button
                    type="button"
                    [disabled]="disabled || selectedCharacterIds.includes(character.id)"
                    (click)="addCharacter(character)"
                  >
                    {{ character.name }} · {{ character.role }}
                    @if (selectedCharacterIds.includes(character.id)) {
                      <span class="picked">✓</span>
                    }
                  </button>
                </li>
              }
            </ul>
          }
          @if (charDropdownOpen() && !filteredChars().length && characterSearch.trim()) {
            <p class="hint">Sin resultados.</p>
          }
        </div>

        @if (selectedCharacterIds.length) {
          <ul class="picked-list">
            @for (id of selectedCharacterIds; track id) {
              @if (characterById(id); as character) {
                <li>
                  <span>{{ character.name }} · {{ character.role }}</span>
                  <button
                    type="button"
                    class="icon"
                    [disabled]="disabled"
                    (click)="removeCharacter(character)"
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
      @if (selectedCharacterIds.length < 2) {
        <p class="hint">Vincula al menos 2 personajes para crear parejas.</p>
      } @else {
        <div class="pairing-section">
          <h4>Parejas principales (protagonistas)</h4>
          @if (mainPairings().length) {
            <ul class="pairings-list">
              @for (p of mainPairings(); track $index) {
                <li>
                  <span class="pair-label"
                    >{{ characterById(p.characterAId)?.name || '?' }} ×
                    {{ characterById(p.characterBId)?.name || '?' }}</span
                  >
                  <button type="button" class="icon" (click)="removePairing(p)">✕</button>
                </li>
              }
            </ul>
          }
          <div class="pairing-form">
            <select
              [ngModel]="mainPairCharA"
              (ngModelChange)="mainPairCharA = $event"
              name="mainPairCharA"
            >
              <option [ngValue]="null">Personaje 1</option>
              @for (c of pairableChars; track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
            <span>×</span>
            <select
              [ngModel]="mainPairCharB"
              (ngModelChange)="mainPairCharB = $event"
              name="mainPairCharB"
            >
              <option [ngValue]="null">Personaje 2</option>
              @for (c of pairableChars; track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
            <button type="button" (click)="addMainPairing()">Añadir</button>
          </div>
          @if (mainPairError()) {
            <p class="pair-error">{{ mainPairError() }}</p>
          }
        </div>

        <div class="pairing-section">
          <h4>Parejas secundarias</h4>
          @if (secondaryPairings().length) {
            <ul class="pairings-list">
              @for (p of secondaryPairings(); track $index) {
                <li>
                  <span class="pair-label"
                    >{{ characterById(p.characterAId)?.name || '?' }} ×
                    {{ characterById(p.characterBId)?.name || '?' }}</span
                  >
                  <button type="button" class="icon" (click)="removePairing(p)">✕</button>
                </li>
              }
            </ul>
          }
          <div class="pairing-form">
            <select
              [ngModel]="secondaryPairCharA"
              (ngModelChange)="secondaryPairCharA = $event"
              name="secondaryPairCharA"
            >
              <option [ngValue]="null">Personaje 1</option>
              @for (c of pairableChars; track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
            <span>×</span>
            <select
              [ngModel]="secondaryPairCharB"
              (ngModelChange)="secondaryPairCharB = $event"
              name="secondaryPairCharB"
            >
              <option [ngValue]="null">Personaje 2</option>
              @for (c of pairableChars; track c.id) {
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
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .full {
        grid-column: 1 / -1;
      }
      .linked-block {
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
      input,
      select,
      button {
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.75rem 0.9rem;
      }
      input:focus,
      select:focus {
        outline: none;
        border-color: var(--accent);
      }
      input::placeholder {
        color: var(--text-3);
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
      .pairings-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
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
      .pair-label {
        font-weight: 600;
      }
      .pair-error {
        color: var(--danger);
        font-size: 0.8rem;
        margin: 0.4rem 0 0;
      }
    `,
  ],
})
export class NovelFormCharacterPairingsComponent {
  @Input() characters: CharacterSummary[] = [];
  @Input() selectedCharacterIds: string[] = [];
  @Input() pairings: PairingDraft[] = [];
  @Input() disabled = false;
  @Output() characterIdsChange = new EventEmitter<string[]>();
  @Output() pairingsChange = new EventEmitter<PairingDraft[]>();

  readonly charDropdownOpen = signal(false);
  characterSearch = '';

  mainPairCharA: string | null = null;
  mainPairCharB: string | null = null;
  secondaryPairCharA: string | null = null;
  secondaryPairCharB: string | null = null;
  readonly mainPairError = signal<string | null>(null);
  readonly secondaryPairError = signal<string | null>(null);

  readonly filteredChars = computed(() => {
    const term = this.characterSearch.trim().toLowerCase();
    const all = this.characters;
    if (!term) return all.slice(0, 50);
    return all.filter((c) => c.name.toLowerCase().includes(term)).slice(0, 50);
  });

  readonly mainPairings = computed(() => this.pairings.filter((p) => p.isMain));
  readonly secondaryPairings = computed(() => this.pairings.filter((p) => !p.isMain));

  get pairableChars(): CharacterSummary[] {
    return this.characters.filter((c) => this.selectedCharacterIds.includes(c.id));
  }

  characterById(id: string): CharacterSummary | undefined {
    return this.characters.find((c) => c.id === id);
  }

  addCharacter(character: CharacterSummary): void {
    if (this.selectedCharacterIds.includes(character.id)) return;
    this.characterIdsChange.emit([...this.selectedCharacterIds, character.id]);
    this.characterSearch = '';
    this.charDropdownOpen.set(false);
  }

  removeCharacter(character: CharacterSummary): void {
    this.characterIdsChange.emit(
      this.selectedCharacterIds.filter((id) => id !== character.id),
    );
  }

  addMainPairing(): void {
    this.mainPairError.set(null);
    if (!this.mainPairCharA || !this.mainPairCharB) {
      this.mainPairError.set('Debes seleccionar 2 personajes para formar una pareja.');
      return;
    }
    if (this.mainPairCharA === this.mainPairCharB) {
      this.mainPairError.set('No puedes seleccionar el mismo personaje dos veces.');
      return;
    }
    const a = this.mainPairCharA;
    const b = this.mainPairCharB;
    const exists = this.pairings.some(
      (p) =>
        (p.characterAId === a && p.characterBId === b) ||
        (p.characterAId === b && p.characterBId === a),
    );
    if (exists) {
      this.mainPairError.set('Esta pareja ya existe.');
      return;
    }
    this.pairingsChange.emit([
      ...this.pairings,
      { characterAId: a, characterBId: b, isMain: true },
    ]);
    this.mainPairCharA = null;
    this.mainPairCharB = null;
  }

  addSecondaryPairing(): void {
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
    const exists = this.pairings.some(
      (p) =>
        (p.characterAId === a && p.characterBId === b) ||
        (p.characterAId === b && p.characterBId === a),
    );
    if (exists) {
      this.secondaryPairError.set('Esta pareja ya existe.');
      return;
    }
    this.pairingsChange.emit([
      ...this.pairings,
      { characterAId: a, characterBId: b, isMain: false },
    ]);
    this.secondaryPairCharA = null;
    this.secondaryPairCharB = null;
  }

  removePairing(p: PairingDraft): void {
    this.pairingsChange.emit(this.pairings.filter((x) => x !== p));
  }

  /** Called by parent to auto-commit pending pair selections before save */
  autoCommitPendingPairs(): { mainError: string | null; secondaryError: string | null } {
    if (this.mainPairCharA && this.mainPairCharB) {
      this.addMainPairing();
    }
    if (this.secondaryPairCharA && this.secondaryPairCharB) {
      this.addSecondaryPairing();
    }
    return {
      mainError: this.mainPairError(),
      secondaryError: this.secondaryPairError(),
    };
  }
}
