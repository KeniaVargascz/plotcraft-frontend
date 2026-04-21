import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, finalize, of } from 'rxjs';
import { CharactersService } from '../../../core/services/characters.service';
import { AuthService } from '../../../core/services/auth.service';
import { MediaService } from '../../../core/services/media.service';
import { NovelsService } from '../../../core/services/novels.service';
import { WorldsService } from '../../../core/services/worlds.service';
import { SeriesService } from '../../series/services/series.service';
import {
  LinkedEntityOption,
  VisualBoard,
  VisualBoardLinkedType,
  VisualBoardSavePayload,
} from '../models/visual-board.model';

export interface CreateBoardDialogData {
  mode: 'create' | 'edit';
  board?: VisualBoard | null;
  prefill?: Partial<VisualBoardSavePayload>;
}

@Component({
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">{{ isEdit ? 'Editar tablero' : 'Nuevo tablero' }}</h2>
    <mat-dialog-content class="dialog-content">
      <div class="intro">
        <p class="eyebrow">Referencias visuales</p>
        <p class="lede">
          Define una portada, visibilidad y vinculacion clara para organizar este tablero.
        </p>
      </div>

      <div class="form">
        <section class="panel">
          <div class="panel-head">
            <h3>Informacion base</h3>
            <p>Titulo, descripcion y visibilidad del tablero.</p>
          </div>

          <label>
            <span>Titulo</span>
            <input
              [(ngModel)]="title"
              maxlength="200"
              placeholder="Ej. Vestuario del reino solar"
            />
          </label>

          <label>
            <span>Descripcion</span>
            <textarea
              [(ngModel)]="description"
              rows="4"
              maxlength="500"
              placeholder="Explica el enfoque visual o el uso del tablero."
            ></textarea>
          </label>

          <label class="checkbox-card">
            <input type="checkbox" [(ngModel)]="isPublic" />
            <div>
              <strong>Tablero publico</strong>
              <p>Otros usuarios podran verlo desde tu perfil y desde el elemento vinculado.</p>
            </div>
          </label>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h3>Portada</h3>
            <p>Puedes pegar una URL o subir una imagen local.</p>
          </div>

          <label>
            <span>Cover URL</span>
            <input [(ngModel)]="coverUrl" placeholder="https://..." />
          </label>

          <label class="upload-card">
            <span>Subir cover</span>
            <input type="file" accept="image/*" (change)="onCoverSelected($event)" />
          </label>

          @if (uploading()) {
            <p class="hint status-hint">Subiendo imagen...</p>
          } @else if (uploadError()) {
            <p class="error status-hint">{{ uploadError() }}</p>
          }

          @if (coverUrl.trim()) {
            <div class="preview">
              <img [src]="coverUrl.trim()" alt="Preview de cover" />
            </div>
          } @else {
            <div class="preview preview-empty">
              <span>La portada aparecera aqui cuando agregues una imagen.</span>
            </div>
          }
        </section>

        <section class="panel">
          <div class="panel-head">
            <h3>Vinculacion</h3>
            <p>Relaciona el tablero con una novela, mundo, personaje o serie.</p>
          </div>

          <label>
            <span>Tipo de vinculacion</span>
            <select [ngModel]="linkedType" (ngModelChange)="setLinkedType($event)">
              <option value="">Sin vinculacion</option>
              <option value="novel">Novela</option>
              <option value="world">Mundo</option>
              <option value="character">Personaje</option>
              <option value="series">Serie</option>
            </select>
          </label>

          @if (linkedType) {
            <div class="linked-grid">
              <div class="field">
                <span>Elemento vinculado</span>
                <div class="search-select">
                  <input
                    class="search-select-input"
                    [value]="linkedInputValue()"
                    (input)="onLinkedSearchChange(($any($event.target).value || '').toString())"
                    (focus)="openLinkedOptions()"
                    [placeholder]="selectedLinkedOption() ? '' : 'Selecciona un elemento'"
                  />
                  <span class="search-select-icon" aria-hidden="true">v</span>

                  @if (showLinkedOptions()) {
                    <div class="search-select-dropdown">
                      @if (getFilteredOptions().length) {
                        <ul class="search-select-list">
                          @for (option of getFilteredOptions(); track option.id) {
                            <li>
                              <button
                                type="button"
                                [class.is-selected]="option.id === linkedId"
                                (mousedown)="handleLinkedOptionMouseDown($event, option)"
                              >
                                <strong>{{ option.label }}</strong>
                                @if (option.subtitle) {
                                  <small>{{ option.subtitle }}</small>
                                }
                              </button>
                            </li>
                          }
                        </ul>
                      } @else {
                        <p class="dropdown-empty">No hay coincidencias.</p>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>

            @if (!loadingOptions() && !entityOptions().length) {
              <p class="hint">No se encontraron elementos propios para este tipo.</p>
            }
          }
        </section>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button class="cancel-btn" (click)="dialogRef.close(null)">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        class="submit-btn"
        [disabled]="saveDisabled()"
        (click)="submit()"
      >
        {{ isEdit ? 'Guardar cambios' : 'Crear tablero' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        padding: 1.25rem 1.5rem 0.25rem;
        margin: 0;
      }
      .dialog-content {
        padding: 0 1.5rem 1rem !important;
      }
      .dialog-actions {
        padding: 0.75rem 1.5rem 1.35rem !important;
        gap: 0.75rem;
      }
      .intro {
        display: grid;
        gap: 0.35rem;
        margin-bottom: 1rem;
      }
      .eyebrow,
      .lede {
        margin: 0;
      }
      .eyebrow {
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-2);
      }
      .lede {
        color: var(--text-2);
        line-height: 1.5;
      }
      .form {
        width: min(100%, 44rem);
        max-width: 100%;
        display: grid;
        gap: 1rem;
      }
      .panel {
        display: grid;
        gap: 0.95rem;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid color-mix(in srgb, var(--border) 88%, rgba(255, 255, 255, 0.08));
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--bg-card) 96%, white 4%),
          color-mix(in srgb, var(--bg-card) 92%, black 8%)
        );
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      }
      .panel-head {
        display: grid;
        gap: 0.2rem;
      }
      .panel-head h3,
      .panel-head p {
        margin: 0;
      }
      .panel-head p {
        color: var(--text-2);
        line-height: 1.45;
      }
      label {
        display: grid;
        gap: 0.45rem;
      }
      span,
      .hint,
      .error {
        font-size: 0.82rem;
      }
      label > span {
        font-weight: 600;
        color: var(--text-2);
      }
      input,
      textarea,
      select {
        width: 100%;
        box-sizing: border-box;
        min-height: 3rem;
        padding: 0.82rem 0.9rem;
        border-radius: 0.9rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        transition:
          border-color 120ms ease,
          box-shadow 120ms ease,
          background-color 120ms ease;
      }
      input:focus,
      textarea:focus,
      select:focus {
        outline: none;
        border-color: color-mix(in srgb, var(--accent-glow) 52%, var(--border));
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-glow) 20%, transparent);
      }
      textarea {
        resize: vertical;
        min-height: 6.5rem;
      }
      .checkbox-card {
        grid-template-columns: auto 1fr;
        align-items: start;
        gap: 0.85rem;
        padding: 0.95rem 1rem;
        border-radius: 0.95rem;
        border: 1px solid var(--border);
        background: color-mix(in srgb, var(--bg-surface) 90%, white 10%);
      }
      .checkbox-card input {
        width: auto;
        min-height: auto;
        margin-top: 0.15rem;
      }
      .checkbox-card strong,
      .checkbox-card p {
        margin: 0;
      }
      .checkbox-card p {
        margin-top: 0.2rem;
        color: var(--text-2);
        line-height: 1.4;
      }
      .upload-card {
        gap: 0.55rem;
      }
      .upload-card input[type='file'] {
        max-width: 100%;
        padding: 0.65rem 0.75rem;
        background: color-mix(in srgb, var(--bg-surface) 90%, white 10%);
      }
      .linked-grid {
        display: grid;
        gap: 0.9rem;
      }
      .search-select {
        position: relative;
      }
      .search-select-input {
        width: 100%;
        min-height: 3rem;
        padding: 0.82rem 2.5rem 0.82rem 0.9rem;
        border-radius: 0.9rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        transition:
          border-color 120ms ease,
          box-shadow 120ms ease,
          background-color 120ms ease;
      }
      .search-select-input:focus {
        outline: none;
        border-color: color-mix(in srgb, var(--accent-glow) 52%, var(--border));
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-glow) 20%, transparent);
      }
      .search-select-icon {
        position: absolute;
        right: 0.95rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-2);
        pointer-events: none;
      }
      .search-select-dropdown {
        position: absolute;
        top: calc(100% + 0.4rem);
        left: 0;
        right: 0;
        z-index: 20;
        margin: 0;
        padding: 0.4rem;
        display: grid;
        gap: 0.4rem;
        border-radius: 0.95rem;
        border: 1px solid var(--border);
        background: color-mix(in srgb, var(--bg-card) 96%, black 4%);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
      }
      .search-select-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.25rem;
        max-height: 13rem;
        overflow-y: auto;
      }
      .search-select-list li {
        margin: 0;
      }
      .search-select-list button {
        width: 100%;
        border: 0;
        border-radius: 0.75rem;
        background: transparent;
        color: var(--text-1);
        padding: 0.7rem 0.8rem;
        text-align: left;
        display: grid;
        gap: 0.12rem;
        cursor: pointer;
      }
      .search-select-list button:hover,
      .search-select-list button.is-selected {
        background: color-mix(in srgb, var(--accent-glow) 18%, var(--bg-surface));
      }
      .search-select-list button small {
        color: var(--text-2);
      }
      .dropdown-empty {
        margin: 0;
        padding: 0.4rem 0.2rem;
        color: var(--text-2);
      }
      .preview {
        min-height: 12rem;
        border-radius: 1rem;
        overflow: hidden;
        border: 1px solid var(--border);
        background:
          radial-gradient(
            circle at top left,
            color-mix(in srgb, var(--accent-glow) 18%, transparent),
            transparent 42%
          ),
          color-mix(in srgb, var(--bg-surface) 92%, black 8%);
      }
      .preview img {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 12rem;
        max-height: 16rem;
        object-fit: cover;
      }
      .preview-empty {
        display: grid;
        place-items: center;
        padding: 1rem;
        color: var(--text-2);
        text-align: center;
      }
      .hint {
        margin: 0;
        color: var(--text-2);
      }
      .status-hint {
        margin-top: -0.2rem;
      }
      .error {
        margin: 0;
        color: #b42318;
      }
      .cancel-btn {
        border-radius: 999px;
      }
      .submit-btn {
        border-radius: 999px;
        padding-inline: 1.1rem;
      }
      @media (max-width: 720px) {
        .dialog-title {
          padding-inline: 1rem;
        }
        .dialog-content {
          padding-inline: 1rem !important;
        }
        .dialog-actions {
          padding-inline: 1rem !important;
        }
        .form {
          width: 100%;
        }
        .panel {
          padding: 0.9rem;
        }
      }
    `,
  ],
})
export class CreateBoardDialogComponent {
  readonly data = inject<CreateBoardDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(
    MatDialogRef<CreateBoardDialogComponent, VisualBoardSavePayload | null>,
  );
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly authService = inject(AuthService);
  private readonly novelsService = inject(NovelsService);
  private readonly worldsService = inject(WorldsService);
  private readonly charactersService = inject(CharactersService);
  private readonly seriesService = inject(SeriesService);
  private readonly mediaService = inject(MediaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEdit = this.data.mode === 'edit';
  readonly loadingOptions = signal(false);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly entityOptions = signal<LinkedEntityOption[]>([]);
  readonly showLinkedOptions = signal(false);

  title = this.data.board?.title ?? this.data.prefill?.title ?? '';
  description = this.data.board?.description ?? this.data.prefill?.description ?? '';
  coverUrl = this.data.board?.coverUrl ?? this.data.prefill?.coverUrl ?? '';
  isPublic = this.data.board?.isPublic ?? this.data.prefill?.isPublic ?? false;
  linkedType: VisualBoardLinkedType | '' =
    this.data.board?.linkedType ?? this.data.prefill?.linkedType ?? '';
  linkedId = this.data.board?.linkedId ?? this.data.prefill?.linkedId ?? '';
  searchTerm = '';

  readonly selectedLinkedOption = computed(
    () => this.entityOptions().find((item) => item.id === this.linkedId) ?? null,
  );
  readonly linkedInputValue = computed(() => {
    if (this.showLinkedOptions()) {
      return this.searchTerm;
    }
    return this.selectedLinkedOption()?.label ?? '';
  });
  constructor() {
    if (this.linkedType) {
      this.loadOptions(this.linkedType);
    }
  }

  saveDisabled() {
    return !this.title.trim() || this.uploading() || (Boolean(this.linkedType) && !this.linkedId);
  }

  setLinkedType(value: string) {
    this.linkedType = (value || '') as VisualBoardLinkedType | '';
    this.linkedId = '';
    this.searchTerm = '';
    this.showLinkedOptions.set(false);
    this.entityOptions.set([]);
    if (this.linkedType) {
      this.loadOptions(this.linkedType);
    }
  }

  toggleLinkedOptions() {
    const next = !this.showLinkedOptions();
    this.showLinkedOptions.set(next);
    if (next) {
      this.searchTerm = '';
    }
  }

  openLinkedOptions() {
    this.showLinkedOptions.set(true);
    this.searchTerm = '';
  }

  closeLinkedOptions(resetSearch = true) {
    if (this.showLinkedOptions()) {
      this.showLinkedOptions.set(false);
    }
    if (resetSearch) {
      this.searchTerm = '';
    }
  }

  onLinkedSearchChange(value: string) {
    this.searchTerm = value;
    this.linkedId = '';
  }

  selectLinkedOption(option: LinkedEntityOption) {
    this.linkedId = option.id;
    this.searchTerm = '';
    this.showLinkedOptions.set(false);

    const input = this.elementRef.nativeElement.querySelector(
      '.search-select-input',
    ) as HTMLInputElement | null;
    if (input) {
      input.value = option.label;
      input.blur();
    }
  }

  handleLinkedOptionMouseDown(event: MouseEvent, option: LinkedEntityOption) {
    event.preventDefault();
    this.selectLinkedOption(option);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeLinkedOptions();
    }
  }

  getFilteredOptions(): LinkedEntityOption[] {
    const term = this.searchTerm.trim().toLowerCase();
    const items = this.entityOptions();
    if (!term) return items;
    return items.filter((item) => this.optionDisplay(item).toLowerCase().includes(term));
  }

  submit() {
    if (this.saveDisabled()) return;
    this.dialogRef.close({
      title: this.title.trim(),
      description: this.description.trim() || null,
      coverUrl: this.coverUrl.trim() || null,
      isPublic: this.isPublic,
      linkedType: (this.linkedType || null) as VisualBoardLinkedType | null,
      linkedId: this.linkedType ? this.linkedId : null,
    });
  }

  onCoverSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadError.set(null);
    this.uploading.set(true);
    this.mediaService
      .upload(file, 'cover')
      .pipe(
        catchError(() => {
          this.uploadError.set(
            'No se pudo subir la imagen con /media/upload. Puedes pegar una URL manualmente.',
          );
          return of(null);
        }),
        finalize(() => this.uploading.set(false)),
      )
      .subscribe((url) => {
        if (url) this.coverUrl = url;
      });
  }

  optionDisplay(option: LinkedEntityOption): string {
    return option.subtitle ? `${option.label} (${option.subtitle})` : option.label;
  }

  private loadOptions(type: VisualBoardLinkedType) {
    const username = this.authService.getCurrentUserSnapshot()?.username;
    if (!username) {
      this.entityOptions.set([]);
      return;
    }

    this.loadingOptions.set(true);

    switch (type) {
      case 'novel':
        this.novelsService.listMine({ limit: 50 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (response) => {
            this.entityOptions.set(
              response.data.map((novel) => ({
                id: novel.id,
                label: novel.title,
                slug: novel.slug,
                subtitle: novel.status,
              })),
            );
            this.loadingOptions.set(false);
          },
          error: () => {
            this.entityOptions.set([]);
            this.loadingOptions.set(false);
          },
        });
        break;
      case 'world':
        this.worldsService.listMine({ limit: 50 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (response) => {
            this.entityOptions.set(
              response.data.map((world) => ({
                id: world.id,
                label: world.name,
                slug: world.slug,
                subtitle: world.genre,
              })),
            );
            this.loadingOptions.set(false);
          },
          error: () => {
            this.entityOptions.set([]);
            this.loadingOptions.set(false);
          },
        });
        break;
      case 'character':
        this.charactersService.listMine({ limit: 50 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (response) => {
            this.entityOptions.set(
              response.data.map((character) => ({
                id: character.id,
                label: character.name,
                slug: character.slug,
                subtitle: character.world?.name ?? null,
              })),
            );
            this.loadingOptions.set(false);
          },
          error: () => {
            this.entityOptions.set([]);
            this.loadingOptions.set(false);
          },
        });
        break;
      case 'series':
        this.seriesService.listByAuthor(username, { limit: 50 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (response) => {
            this.entityOptions.set(
              response.data.map((series) => ({
                id: series.id,
                label: series.title,
                slug: series.slug,
                subtitle: series.status,
              })),
            );
            this.loadingOptions.set(false);
          },
          error: () => {
            this.entityOptions.set([]);
            this.loadingOptions.set(false);
          },
        });
        break;
    }
  }
}
