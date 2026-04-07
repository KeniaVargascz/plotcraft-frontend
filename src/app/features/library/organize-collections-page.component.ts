import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  CdkDrag,
  CdkDragHandle,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { SeriesNovelItem } from '../series/models/series.model';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { NovelsService } from '../../core/services/novels.service';
import { NovelSummary } from '../../core/models/novel.model';
import { AlertDialogComponent } from '../../shared/components/alert-dialog/alert-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SeriesService } from '../series/services/series.service';
import { SeriesDetail, SeriesType } from '../series/models/series.model';

@Component({
  selector: 'app-organize-collections-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDropList, CdkDrag, CdkDragHandle],
  template: `
    <section class="organize-shell">
      <header class="page-header">
        <h1>Organizar colecciones</h1>
        <button type="button" (click)="openCreate()">+ Nueva colección</button>
      </header>

      @if (loading()) {
        <p>Cargando colecciones...</p>
      }

      @if (showCreate()) {
        <article class="create-card">
          <h2>Crear nueva colección</h2>
          <input
            [ngModel]="newTitle()"
            (ngModelChange)="newTitle.set($event)"
            placeholder="Título"
          />
          <select
            [ngModel]="newType()"
            (ngModelChange)="newType.set($event)"
          >
            <option value="SAGA">Saga</option>
            <option value="TRILOGY">Trilogía</option>
            <option value="DILOGY">Bilogía</option>
            <option value="SERIES">Serie</option>
          </select>
          <textarea
            [ngModel]="newDescription()"
            (ngModelChange)="newDescription.set($event)"
            placeholder="Descripción (opcional)"
          ></textarea>

          <fieldset class="picker">
            <legend>Novelas a incluir</legend>
            @if (availableNovels().length === 0 && selectedNovelIds().length === 0) {
              <p class="hint">No tienes novelas disponibles para agregar.</p>
            } @else {
              <div class="search-box">
                <input
                  type="text"
                  [(ngModel)]="novelSearch"
                  placeholder="Buscar novela por título..."
                  (focus)="novelDropdownOpen.set(true)"
                />
                @if (novelDropdownOpen() && filteredAvailableNovels().length) {
                  <ul class="dropdown">
                    @for (novel of filteredAvailableNovels(); track novel.id) {
                      <li>
                        <button type="button" (click)="addNovel(novel.id)">
                          {{ novel.title }}
                        </button>
                      </li>
                    }
                  </ul>
                }
                @if (novelDropdownOpen() && !filteredAvailableNovels().length && novelSearch.trim()) {
                  <p class="hint">Sin resultados.</p>
                }
              </div>

              @if (selectedNovelIds().length) {
                <ul class="picked-list">
                  @for (id of selectedNovelIds(); track id) {
                    @if (novelById(id); as novel) {
                      <li>
                        <span>{{ novel.title }}</span>
                        <button type="button" class="icon" (click)="toggleNovel(id)">✕</button>
                      </li>
                    }
                  }
                </ul>
              }
            }
          </fieldset>

          <fieldset class="picker">
            <legend>Colecciones hijas (opcional)</legend>
            @if (availableChildren().length === 0 && selectedChildIds().length === 0) {
              <p class="hint">No hay otras colecciones para anidar.</p>
            } @else {
              <div class="search-box">
                <input
                  type="text"
                  [(ngModel)]="childSearch"
                  placeholder="Buscar colección por título..."
                  (focus)="childDropdownOpen.set(true)"
                />
                @if (childDropdownOpen() && filteredAvailableChildren().length) {
                  <ul class="dropdown">
                    @for (child of filteredAvailableChildren(); track child.id) {
                      <li>
                        <button type="button" (click)="addChild(child.id)">
                          {{ child.title }}
                        </button>
                      </li>
                    }
                  </ul>
                }
                @if (childDropdownOpen() && !filteredAvailableChildren().length && childSearch.trim()) {
                  <p class="hint">Sin resultados.</p>
                }
              </div>

              @if (selectedChildIds().length) {
                <ul class="picked-list">
                  @for (id of selectedChildIds(); track id) {
                    @if (collectionById(id); as col) {
                      <li>
                        <span>{{ col.title }}</span>
                        <button type="button" class="icon" (click)="toggleChild(id)">✕</button>
                      </li>
                    }
                  }
                </ul>
              }
            }
          </fieldset>

          @if (selectedNovelIds().length === 0 && selectedChildIds().length === 0) {
            <p class="hint">
              Una colección debe contener al menos una novela o una colección hija para guardarse.
            </p>
          }

          <div class="actions">
            <button type="button" (click)="create()" [disabled]="!canCreate() || creating()">
              {{ creating() ? 'Creando...' : 'Crear' }}
            </button>
            <button type="button" (click)="cancelCreate()">Cancelar</button>
          </div>
        </article>
      }

      @for (col of collections(); track col.id) {
        <article class="collection-card">
          <header>
            <input
              [(ngModel)]="col.title"
              (blur)="renameCollection(col)"
            />
            <button type="button" class="danger" (click)="confirmDelete(col)">
              Eliminar colección
            </button>
          </header>

          @if (col.parent) {
            <p class="parent-link">
              Dentro de: <strong>{{ col.parent.title }}</strong>
            </p>
          }

          <h3>Elementos</h3>
          @if (!col.novels?.length && !col.children?.length) {
            <p class="hint">Esta colección está vacía. Añade una novela o colección.</p>
          }

          @if (col.novels?.length) {
            <ul
              class="items-list"
              cdkDropList
              [cdkDropListData]="col.novels"
              (cdkDropListDropped)="onReorderNovels(col, $event)"
            >
              @for (n of col.novels; track n.id) {
                <li class="drag-item" cdkDrag>
                  <span class="drag-handle" cdkDragHandle>⠿</span>
                  <span class="item-icon">📖</span>
                  <span class="item-title">{{ n.orderIndex }}. {{ n.title }}</span>
                  <button
                    type="button"
                    class="icon"
                    (click)="removeNovelFrom(col, n.id, n.title)"
                    title="Quitar"
                  >
                    ✕
                  </button>
                </li>
              }
            </ul>
          }

          @if (col.children?.length) {
            <ul class="items-list">
              @for (c of col.children; track c.id) {
                <li class="drag-item">
                  <span class="item-icon">📚</span>
                  <span class="item-title">{{ c.title }}</span>
                  <button
                    type="button"
                    class="icon"
                    (click)="removeChildFrom(col, c.id, c.title)"
                    title="Desvincular"
                  >
                    ✕
                  </button>
                </li>
              }
            </ul>
          }

          <div class="add-item-row">
            <div class="search-box">
              <input
                type="text"
                [ngModel]="cardSearch()[col.id] || ''"
                (ngModelChange)="setCardSearch(col.id, $event)"
                (focus)="openCardDropdown(col.id)"
                placeholder="Añadir novela o colección..."
              />
              @if (cardDropdownOpen() === col.id) {
                @let opts = cardSearchResults(col);
                @if (opts.length) {
                  <ul class="dropdown">
                    @for (opt of opts; track opt.id) {
                      <li>
                        <button type="button" (click)="addItemTo(col, opt)">
                          <span class="item-icon">{{ opt.kind === 'novel' ? '📖' : '📚' }}</span>
                          {{ opt.title }}
                        </button>
                      </li>
                    }
                  </ul>
                } @else if ((cardSearch()[col.id] || '').trim()) {
                  <p class="hint dropdown-empty">Sin resultados.</p>
                }
              }
            </div>
          </div>
        </article>
      }

      @if (!loading() && !collections().length) {
        <p>Todavía no tienes colecciones. Crea la primera con el botón superior.</p>
      }
    </section>
  `,
  styles: [
    `
      .organize-shell {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .create-card,
      .collection-card {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 1rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
      }
      .collection-card header {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
      }
      .collection-card header input {
        flex: 1;
        font-size: 1.1rem;
        font-weight: 600;
      }
      input,
      select,
      textarea,
      button {
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.6rem 0.8rem;
      }
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .danger {
        color: #ff8b8b;
      }
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.4rem;
      }
      li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 0.6rem;
        background: var(--bg-surface);
        border-radius: 0.6rem;
      }
      .picker {
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        padding: 0.75rem;
        background: var(--bg-surface);
      }
      .picker legend {
        padding: 0 0.4rem;
        font-weight: 600;
        color: var(--text-2);
      }
      .picker-list li {
        background: transparent;
        padding: 0.25rem 0;
      }
      .picker-list label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }
      .search-box {
        position: relative;
      }
      .dropdown {
        position: absolute;
        left: 0;
        right: 0;
        margin: 0.25rem 0 0;
        padding: 0.25rem;
        list-style: none;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        max-height: 220px;
        overflow-y: auto;
        z-index: 5;
        box-shadow: 0 12px 28px -16px var(--shadow);
      }
      .dropdown li {
        padding: 0;
        background: transparent;
      }
      .dropdown button {
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        padding: 0.55rem 0.7rem;
        border-radius: 0.6rem;
        color: var(--text-1);
        cursor: pointer;
      }
      .dropdown button:hover {
        background: var(--bg-surface);
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
      .hint {
        margin: 0;
        color: var(--text-2);
      }
      .actions {
        display: flex;
        gap: 0.5rem;
      }
      .items-list {
        display: grid;
        gap: 0.4rem;
      }
      .drag-item {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        align-items: center;
        gap: 0.6rem;
        padding: 0.55rem 0.75rem;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 0.75rem;
      }
      .drag-handle {
        cursor: grab;
        color: var(--text-3);
        font-size: 1.2rem;
        line-height: 1;
        user-select: none;
      }
      .drag-handle:active {
        cursor: grabbing;
      }
      .item-icon {
        font-size: 1rem;
      }
      .item-title {
        color: var(--text-1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .drag-item .icon {
        background: transparent;
        border: 0;
        color: var(--text-2);
        cursor: pointer;
        padding: 0.2rem 0.4rem;
      }
      .drag-item .icon:hover {
        color: #ff8b8b;
      }
      .add-item-row {
        margin-top: 0.5rem;
      }
      .dropdown-empty {
        position: absolute;
        left: 0;
        right: 0;
        margin: 0.25rem 0 0;
        padding: 0.5rem 0.7rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        z-index: 5;
      }
      .cdk-drag-preview {
        box-shadow:
          0 5px 5px -3px rgba(0, 0, 0, 0.2),
          0 8px 10px 1px rgba(0, 0, 0, 0.14),
          0 3px 14px 2px rgba(0, 0, 0, 0.12);
      }
      .cdk-drag-placeholder {
        opacity: 0.3;
      }
      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
      .items-list.cdk-drop-list-dragging .drag-item:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
})
export class OrganizeCollectionsPageComponent implements OnInit {
  private readonly seriesService = inject(SeriesService);
  private readonly authService = inject(AuthService);
  private readonly novelsService = inject(NovelsService);
  private readonly dialog = inject(MatDialog);

  readonly collections = signal<SeriesDetail[]>([]);
  readonly myNovels = signal<NovelSummary[]>([]);
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly showCreate = signal(false);
  readonly selectedNovelIds = signal<string[]>([]);
  readonly selectedChildIds = signal<string[]>([]);
  readonly novelDropdownOpen = signal(false);
  readonly childDropdownOpen = signal(false);

  readonly newTitle = signal('');
  readonly newType = signal<SeriesType>('SAGA');
  readonly newDescription = signal('');
  novelSearch = '';
  childSearch = '';

  // Per-card add-item state
  readonly cardSearch = signal<Record<string, string>>({});
  readonly cardDropdownOpen = signal<string | null>(null);

  setCardSearch(colId: string, value: string): void {
    this.cardSearch.update((map) => ({ ...map, [colId]: value }));
  }

  openCardDropdown(colId: string): void {
    this.cardDropdownOpen.set(colId);
  }

  closeCardDropdown(): void {
    this.cardDropdownOpen.set(null);
  }

  cardSearchResults(col: SeriesDetail): Array<{
    id: string;
    title: string;
    kind: 'novel' | 'collection';
  }> {
    const term = (this.cardSearch()[col.id] || '').trim().toLowerCase();
    const taken = this.novelsInAnyCollection();

    const novelOpts = this.myNovels()
      .filter((n) => !taken.has(n.id))
      .map((n) => ({ id: n.id, title: n.title, kind: 'novel' as const }));

    const childOpts = this.collections()
      .filter((c) => c.id !== col.id && !c.parentId)
      .map((c) => ({ id: c.id, title: c.title, kind: 'collection' as const }));

    const all = [...novelOpts, ...childOpts];
    const filtered = term
      ? all.filter((o) => o.title.toLowerCase().includes(term))
      : all;
    return filtered.slice(0, 20);
  }

  addItemTo(
    col: SeriesDetail,
    opt: { id: string; title: string; kind: 'novel' | 'collection' },
  ): void {
    this.setCardSearch(col.id, '');
    this.closeCardDropdown();

    if (opt.kind === 'novel') {
      const nextOrder = (col.novels?.length ?? 0) + 1;
      this.seriesService.addNovel(col.slug, opt.id, nextOrder).subscribe({
        next: (updated) => {
          this.collections.update((items) =>
            items.map((c) => (c.id === col.id ? updated : c)),
          );
        },
        error: (err) => this.showError(err, 'No se pudo añadir la novela.'),
      });
    } else {
      // Add child collection: set its parentId to this collection's id
      const child = this.collections().find((c) => c.id === opt.id);
      if (!child) return;
      this.seriesService.updateParent(child.slug, col.id).subscribe({
        next: () => this.loadCollections(),
        error: (err) => this.showError(err, 'No se pudo añadir la colección hija.'),
      });
    }
  }

  removeChildFrom(parent: SeriesDetail, childId: string, childTitle: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Desvincular colección',
          description: `¿Quitar "${childTitle}" de "${parent.title}"? La colección hija no se eliminará.`,
          confirmText: 'Desvincular',
          cancelText: 'Cancelar',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok || ok === 'false') return;
        const child = this.collections().find((c) => c.id === childId);
        if (!child) return;
        this.seriesService.updateParent(child.slug, null).subscribe({
          next: () => this.loadCollections(),
          error: (err) =>
            this.showError(err, 'No se pudo desvincular la colección.'),
        });
      });
  }

  onReorderNovels(col: SeriesDetail, event: CdkDragDrop<SeriesNovelItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const novels = [...(col.novels ?? [])];
    moveItemInArray(novels, event.previousIndex, event.currentIndex);

    // Optimistic local update with new orderIndex values
    const reordered = novels.map((n, i) => ({ ...n, orderIndex: i + 1 }));
    this.collections.update((items) =>
      items.map((c) => (c.id === col.id ? { ...c, novels: reordered } : c)),
    );

    this.seriesService
      .reorderNovels(
        col.slug,
        reordered.map((n) => ({ novelId: n.id, orderIndex: n.orderIndex })),
      )
      .subscribe({
        next: (updated) => {
          this.collections.update((items) =>
            items.map((c) => (c.id === col.id ? updated : c)),
          );
        },
        error: (err) => {
          // Revert on failure
          this.loadCollections();
          this.showError(err, 'No se pudo reordenar.');
        },
      });
  }

  readonly novelsInAnyCollection = computed(() => {
    const ids = new Set<string>();
    for (const col of this.collections()) {
      for (const n of col.novels ?? []) {
        ids.add(n.id);
      }
    }
    return ids;
  });

  readonly availableNovels = computed(() => {
    const taken = this.novelsInAnyCollection();
    return this.myNovels().filter((n) => !taken.has(n.id));
  });

  readonly availableChildren = computed(() =>
    this.collections().filter((c) => !c.parentId && !this.selectedChildIds().includes(c.id)),
  );

  readonly filteredAvailableNovels = computed(() => {
    const term = this.novelSearch.trim().toLowerCase();
    const list = this.availableNovels().filter(
      (n) => !this.selectedNovelIds().includes(n.id),
    );
    if (!term) return list.slice(0, 50);
    return list.filter((n) => n.title.toLowerCase().includes(term)).slice(0, 50);
  });

  readonly filteredAvailableChildren = computed(() => {
    const term = this.childSearch.trim().toLowerCase();
    const list = this.availableChildren();
    if (!term) return list.slice(0, 50);
    return list.filter((c) => c.title.toLowerCase().includes(term)).slice(0, 50);
  });

  novelById(id: string): NovelSummary | undefined {
    return this.myNovels().find((n) => n.id === id);
  }

  collectionById(id: string): SeriesDetail | undefined {
    return this.collections().find((c) => c.id === id);
  }

  addNovel(novelId: string): void {
    if (this.selectedNovelIds().includes(novelId)) return;
    this.selectedNovelIds.update((ids) => [...ids, novelId]);
    this.novelSearch = '';
    this.novelDropdownOpen.set(false);
  }

  addChild(childId: string): void {
    if (this.selectedChildIds().includes(childId)) return;
    this.selectedChildIds.update((ids) => [...ids, childId]);
    this.childSearch = '';
    this.childDropdownOpen.set(false);
  }

  readonly canCreate = computed(() => {
    const titleOk = this.newTitle().trim().length > 0;
    const hasContent =
      this.selectedNovelIds().length > 0 || this.selectedChildIds().length > 0;
    return titleOk && hasContent;
  });

  ngOnInit(): void {
    this.loadCollections();
    this.loadMyNovels();
  }

  loadCollections(): void {
    const username = this.authService.getCurrentUserSnapshot()?.username;
    if (!username) return;
    this.loading.set(true);
    this.seriesService.listByAuthor(username, { limit: 50 }).subscribe({
      next: (response) => {
        const summaries = response.data;
        if (!summaries.length) {
          this.collections.set([]);
          this.loading.set(false);
          return;
        }
        forkJoin(summaries.map((s) => this.seriesService.getBySlug(s.slug))).subscribe({
          next: (details) => {
            this.collections.set(details);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => {
        this.collections.set([]);
        this.loading.set(false);
      },
    });
  }

  loadMyNovels(): void {
    this.novelsService.listMine({ limit: 50 }).subscribe({
      next: (response) => this.myNovels.set(response.data),
      error: () => this.myNovels.set([]),
    });
  }

  openCreate(): void {
    this.showCreate.set(true);
  }

  cancelCreate(): void {
    this.showCreate.set(false);
    this.newTitle.set('');
    this.newDescription.set('');
    this.newType.set('SAGA');
    this.selectedNovelIds.set([]);
    this.selectedChildIds.set([]);
    this.novelSearch = '';
    this.childSearch = '';
    this.novelDropdownOpen.set(false);
    this.childDropdownOpen.set(false);
  }

  toggleNovel(novelId: string): void {
    this.selectedNovelIds.update((ids) =>
      ids.includes(novelId) ? ids.filter((id) => id !== novelId) : [...ids, novelId],
    );
  }

  toggleChild(childId: string): void {
    this.selectedChildIds.update((ids) =>
      ids.includes(childId) ? ids.filter((id) => id !== childId) : [...ids, childId],
    );
  }

  create(): void {
    if (!this.canCreate() || this.creating()) return;
    this.creating.set(true);

    this.seriesService
      .create({
        title: this.newTitle().trim(),
        type: this.newType(),
        description: this.newDescription().trim() || undefined,
        novelIds: this.selectedNovelIds().length ? this.selectedNovelIds() : undefined,
        childSeriesIds: this.selectedChildIds().length ? this.selectedChildIds() : undefined,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.cancelCreate();
          this.loadCollections();
        },
        error: (err) => {
          this.creating.set(false);
          this.showError(err, 'Ocurrió un error al crear la colección.');
        },
      });
  }

  renameCollection(col: SeriesDetail): void {
    const title = (col.title || '').trim();
    if (!title) return;
    this.seriesService.update(col.slug, { title }).subscribe({
      next: (updated) => {
        this.collections.update((items) =>
          items.map((c) => (c.id === col.id ? { ...c, ...updated } : c)),
        );
      },
    });
  }

  removeNovelFrom(col: SeriesDetail, novelId: string, novelTitle: string): void {
    const isLast = (col.novels?.length ?? 0) <= 1;
    const dialogData = isLast
      ? {
          title: 'Eliminar última novela',
          description: `Al eliminar la única novela de "${col.title}", esta colección será eliminada (las novelas NO se eliminarán). ¿Desea continuar?`,
          confirmText: 'Sí, continuar',
          cancelText: 'Cancelar',
        }
      : {
          title: 'Quitar novela',
          description: `¿Quitar "${novelTitle}" de "${col.title}"?`,
          confirmText: 'Quitar',
          cancelText: 'Cancelar',
        };

    this.dialog
      .open(ConfirmDialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok || ok === 'false') return;
        this.seriesService.removeNovel(col.slug, novelId).subscribe({
          next: (result) => {
            if (result.deleted) {
              this.loadCollections();
            } else if (result.series) {
              const updated = result.series;
              this.collections.update((items) =>
                items.map((c) => (c.id === col.id ? updated : c)),
              );
            }
          },
          error: (err) => this.showError(err, 'No se pudo quitar la novela.'),
        });
      });
  }

  confirmDelete(col: SeriesDetail): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar colección',
          description: `¿Eliminar la colección "${col.title}"? Las novelas dentro de ella NO se eliminarán.`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok || ok === 'false') return;
        this.seriesService.delete(col.slug).subscribe({
          next: () => {
            this.dialog.open(AlertDialogComponent, {
              data: {
                title: 'Colección eliminada',
                message: 'La colección fue eliminada. Las novelas se mantienen.',
              },
            });
            this.loadCollections();
          },
          error: (err) => this.showError(err, 'No se pudo eliminar la colección.'),
        });
      });
  }

  private showError(err: unknown, fallback: string): void {
    const e = err as { error?: { error?: { message?: string }; message?: string }; message?: string };
    const message =
      e?.error?.error?.message || e?.error?.message || e?.message || fallback;
    this.dialog.open(AlertDialogComponent, {
      data: { title: 'Error', message },
    });
  }
}
