import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import {
  CharacterKinshipType,
  CharacterRelationship,
  CharacterSummary,
} from '../../../core/models/character.model';
import { CharactersService } from '../../../core/services/characters.service';

type DialogData = {
  currentCharacterId: string;
  username: string;
  slug: string;
};

type KinshipOption = {
  value: CharacterKinshipType;
  label: string;
};

@Component({
  selector: 'app-character-kinship-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Agregar parentesco</h2>
    <div mat-dialog-content class="content">
      <label class="field">
        <span>Tipo de parentesco</span>
        <select [(ngModel)]="kinshipType">
          @for (option of kinshipOptions; track option.value) {
            <option [ngValue]="option.value">{{ option.label }}</option>
          }
        </select>
      </label>

      <label class="field">
        <span>Buscar personaje</span>
        <input
          type="text"
          [(ngModel)]="search"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Escribe al menos 2 caracteres"
        />
      </label>

      @if (selectedTarget(); as target) {
        <div class="selected">
          <div>
            <strong>{{ target.name }}</strong>
            <small>@{{ target.author.username }}</small>
          </div>
          <button type="button" (click)="clearSelection()">Cambiar</button>
        </div>
      } @else if (suggestions().length) {
        <ul class="suggestions">
          @for (character of suggestions(); track character.id) {
            <li>
              <button type="button" (click)="selectTarget(character)">
                <span>{{ character.name }}</span>
                <small>@{{ character.author.username }}</small>
              </button>
            </li>
          }
        </ul>
      } @else if (search.trim().length >= 2 && !loadingSuggestions()) {
        <p class="hint">No se encontraron personajes coincidentes.</p>
      }

      <label class="field">
        <span>Nota opcional</span>
        <textarea
          [(ngModel)]="description"
          rows="3"
          maxlength="500"
          placeholder="Contexto adicional para esta relacion"
        ></textarea>
      </label>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </div>

    <div mat-dialog-actions align="end">
      <button type="button" (click)="dialogRef.close(null)">Cancelar</button>
      <button
        type="button"
        class="primary"
        [disabled]="!selectedTarget() || saving()"
        (click)="submit()"
      >
        {{ saving() ? 'Guardando...' : 'Guardar parentesco' }}
      </button>
    </div>
  `,
  styles: [
    `
      .content {
        display: grid;
        gap: 0.9rem;
        min-width: min(34rem, 80vw);
      }
      .field {
        display: grid;
        gap: 0.35rem;
      }
      .field input,
      .field textarea,
      .field select {
        padding: 0.65rem 0.8rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font: inherit;
      }
      .selected {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.85rem 1rem;
        border: 1px solid var(--border);
        border-radius: 0.9rem;
        background: var(--bg-card);
      }
      .selected small,
      .hint {
        color: var(--text-2);
      }
      .suggestions {
        list-style: none;
        margin: 0;
        padding: 0.35rem;
        border: 1px solid var(--border);
        border-radius: 0.9rem;
        background: var(--bg-card);
        display: grid;
        gap: 0.25rem;
        max-height: 15rem;
        overflow: auto;
      }
      .suggestions button {
        width: 100%;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem 0.8rem;
        border: 0;
        border-radius: 0.7rem;
        background: transparent;
        color: var(--text-1);
        text-align: left;
        cursor: pointer;
      }
      .suggestions button:hover {
        background: var(--bg-surface);
      }
      .suggestions small,
      .error {
        color: var(--text-2);
      }
      .error {
        color: var(--danger, #e49d9d);
        margin: 0;
      }
      [mat-dialog-actions] button {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
      }
      [mat-dialog-actions] .primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      [mat-dialog-actions] button[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
      @media (max-width: 640px) {
        .content {
          min-width: 0;
        }
        .selected {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterKinshipDialogComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly charactersService = inject(CharactersService);
  readonly dialogRef = inject(
    MatDialogRef<CharacterKinshipDialogComponent, CharacterRelationship | null>,
  );
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  readonly suggestions = signal<CharacterSummary[]>([]);
  readonly selectedTarget = signal<CharacterSummary | null>(null);
  readonly saving = signal(false);
  readonly loadingSuggestions = signal(false);
  readonly error = signal<string | null>(null);

  readonly kinshipOptions: KinshipOption[] = [
    { value: 'PARENT', label: 'Padre/Madre' },
    { value: 'CHILD', label: 'Hijo/Hija' },
    { value: 'SIBLING', label: 'Hermano/a' },
    { value: 'GRANDPARENT', label: 'Abuelo/a' },
    { value: 'GRANDCHILD', label: 'Nieto/a' },
    { value: 'UNCLE_AUNT', label: 'Tio/Tia' },
    { value: 'NIECE_NEPHEW', label: 'Sobrino/a' },
    { value: 'COUSIN', label: 'Primo/a' },
    { value: 'SPOUSE', label: 'Conyuge' },
    { value: 'STEP_PARENT', label: 'Padre/Madre adoptivo' },
    { value: 'STEP_CHILD', label: 'Hijo/Hija adoptivo' },
    { value: 'GUARDIAN', label: 'Tutor/a' },
    { value: 'WARD', label: 'Tutelado/a' },
  ];

  kinshipType: CharacterKinshipType = 'PARENT';
  search = '';
  description = '';

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          const normalized = term.trim();
          if (normalized.length < 2) {
            this.loadingSuggestions.set(false);
            this.suggestions.set([]);
            return of({ data: [], pagination: { nextCursor: null, hasMore: false, limit: 0 } });
          }

          this.loadingSuggestions.set(true);
          return this.charactersService.listMine({
            search: normalized,
            limit: 12,
            sort: 'updated',
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.loadingSuggestions.set(false);
          this.suggestions.set(
            response.data.filter((character) => character.id !== this.data.currentCharacterId),
          );
        },
        error: () => {
          this.loadingSuggestions.set(false);
          this.suggestions.set([]);
        },
      });
  }

  onSearchChange(value: string) {
    this.search = value;
    this.error.set(null);
    if (this.selectedTarget() && this.selectedTarget()!.name !== value.trim()) {
      this.selectedTarget.set(null);
    }
    this.search$.next(value);
  }

  selectTarget(character: CharacterSummary) {
    this.selectedTarget.set(character);
    this.search = character.name;
    this.suggestions.set([]);
    this.error.set(null);
  }

  clearSelection() {
    this.selectedTarget.set(null);
    this.search = '';
    this.error.set(null);
    this.suggestions.set([]);
  }

  submit() {
    const target = this.selectedTarget();
    if (!target) {
      this.error.set('Debes seleccionar un personaje relacionado.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.charactersService
      .createRelationship(this.data.username, this.data.slug, {
        targetId: target.id,
        category: 'KINSHIP',
        kinshipType: this.kinshipType,
        description: this.description.trim() || null,
      })
      .subscribe({
        next: (relationship) => {
          this.saving.set(false);
          this.dialogRef.close(relationship);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo guardar el parentesco.');
        },
      });
  }
}
