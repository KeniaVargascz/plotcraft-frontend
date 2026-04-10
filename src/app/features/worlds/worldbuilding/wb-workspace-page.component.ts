import { Component, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter, switchMap } from 'rxjs';
import { finalize } from 'rxjs';
import { WbCategorySummary, WbCategory } from '../../../core/models/wb-category.model';
import { WbEntrySummary, WbEntryDetail } from '../../../core/models/wb-entry.model';
import { WorldsService } from '../../../core/services/worlds.service';
import { WorldbuildingService } from '../../../core/services/worldbuilding.service';
import { MarkdownService } from '../../../core/services/markdown.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  PromptDialogComponent,
  PromptDialogData,
} from '../../../shared/components/prompt-dialog/prompt-dialog.component';
import {
  AlertDialogComponent,
  AlertDialogData,
} from '../../../shared/components/alert-dialog/alert-dialog.component';
import { WbSidebarComponent } from './components/wb-sidebar.component';
import { WbEntryGridComponent } from './components/wb-entry-grid.component';
import { WbEntryLinksComponent } from './components/wb-entry-links.component';
import { WbCategoryFormDialogComponent } from './wb-category-form-dialog.component';
import { WbTemplatePickerDialogComponent } from './wb-template-picker-dialog.component';

@Component({
  selector: 'app-wb-workspace-page',
  standalone: true,
  imports: [
    RouterLink,
    WbSidebarComponent,
    WbEntryGridComponent,
    WbEntryLinksComponent,
    WbCategoryFormDialogComponent,
    WbTemplatePickerDialogComponent,
  ],
  template: `
    <section class="workspace">
      <app-wb-sidebar
        [worldSlug]="worldSlug()"
        [worldName]="worldName()"
        [categories]="categories()"
        [activeCategorySlug]="activeCategorySlug()"
        (categorySelected)="onCategorySelected($event)"
        (addCategory)="openCategoryDialog()"
        (searchQuery)="onSearch($event)"
      />

      <main class="content-area">
        <div class="content-header">
          <div class="header-left">
            <h1>{{ activeCategoryName() || 'World-building' }}</h1>
            @if (searchMode()) {
              <span class="search-indicator">Resultados para "{{ searchTerm() }}"</span>
            }
          </div>
          <div class="header-actions">
            @if (activeCategorySlug()) {
              <a
                class="action-btn primary"
                [routerLink]="[
                  '/mis-mundos',
                  worldSlug(),
                  'world-building',
                  activeCategorySlug(),
                  'nueva',
                ]"
              >
                + Nueva entrada
              </a>
              <button type="button" class="action-btn" (click)="openCategoryEditDialog()">
                Editar categoria
              </button>
              <button type="button" class="action-btn danger" (click)="deleteActiveCategory()">
                Eliminar
              </button>
            }
          </div>
        </div>

        @if (loadingEntries()) {
          <p class="state">Cargando entradas...</p>
        } @else if (entries().length) {
          <app-wb-entry-grid
            [entries]="entries()"
            [showActions]="true"
            (entrySelected)="selectEntry($event)"
            (entryEdit)="editEntry($event)"
            (entryDelete)="deleteEntry($event)"
          />
          @if (hasMoreEntries()) {
            <button
              type="button"
              class="load-more-btn"
              (click)="loadMore()"
              [disabled]="loadingMore()"
            >
              {{ loadingMore() ? 'Cargando...' : 'Cargar mas' }}
            </button>
          }
        } @else if (!searchMode()) {
          <div class="empty-state card">
            <h2>Comienza tu world-building</h2>
            <p>
              Crea categorias para organizar el lore de tu mundo: personajes, lugares,
              organizaciones, magia y mas.
            </p>
            <div class="empty-actions">
              <button type="button" class="action-btn primary" (click)="openTemplateDialog()">
                Usar plantilla
              </button>
              <button type="button" class="action-btn" (click)="openCategoryDialog()">
                Crear categoria personalizada
              </button>
            </div>
          </div>
        } @else {
          <div class="empty-state card">
            <p>No se encontraron entradas para "{{ searchTerm() }}".</p>
          </div>
        }
      </main>

      @if (selectedEntry()) {
        <aside class="detail-panel">
          <div class="detail-header">
            <h3>{{ selectedEntry()!.name }}</h3>
            <button type="button" class="close-detail" (click)="selectedEntry.set(null)">
              &#10005;
            </button>
          </div>
          @if (loadingDetail()) {
            <p class="state">Cargando...</p>
          } @else if (entryDetail()) {
            <div class="detail-body">
              @if (entryDetail()!.coverUrl) {
                <img [src]="entryDetail()!.coverUrl" alt="" class="detail-cover" />
              }
              <div class="detail-meta">
                <span
                  class="cat-badge"
                  [style.background]="(entryDetail()!.category.color || '#6366f1') + '22'"
                  [style.color]="entryDetail()!.category.color || '#6366f1'"
                >
                  {{ entryDetail()!.category.icon }} {{ entryDetail()!.category.name }}
                </span>
                @if (!entryDetail()!.isPublic) {
                  <span class="private-badge">Privado</span>
                }
              </div>
              @if (entryDetail()!.summary) {
                <p class="detail-summary">{{ entryDetail()!.summary }}</p>
              }
              @if (entryDetail()!.content) {
                <div
                  class="detail-content"
                  [innerHTML]="markdownService.render(entryDetail()!.content!)"
                ></div>
              }
              @if (entryDetail()!.tags.length) {
                <div class="detail-tags">
                  @for (tag of entryDetail()!.tags; track tag) {
                    <span class="tag-chip">{{ tag }}</span>
                  }
                </div>
              }

              <app-wb-entry-links
                [links]="entryDetail()!.links || []"
                [isOwner]="true"
                (deleteLink)="onDeleteLink($event)"
                (addLink)="onAddLink()"
              />

              <div class="detail-actions">
                <a
                  class="action-btn primary"
                  [routerLink]="[
                    '/mis-mundos',
                    worldSlug(),
                    'world-building',
                    entryDetail()!.category.slug,
                    entryDetail()!.slug,
                    'editar',
                  ]"
                >
                  Editar entrada
                </a>
              </div>
            </div>
          }
        </aside>
      }
    </section>

    <app-wb-category-form-dialog
      #categoryDialog
      [worldSlug]="worldSlug()"
      [category]="editingCategory()"
      (saved)="onCategorySaved()"
    />
    <app-wb-template-picker-dialog
      #templateDialog
      [worldSlug]="worldSlug()"
      (created)="onCategorySaved()"
    />
  `,
  styles: [
    `
      .workspace {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 1rem;
        min-height: calc(100vh - 6rem);
      }
      .workspace:has(.detail-panel) {
        grid-template-columns: 220px 1fr 320px;
      }
      .content-area {
        display: grid;
        gap: 1rem;
        align-content: start;
      }
      .content-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .header-left h1 {
        margin: 0;
        font-size: 1.35rem;
        color: var(--text-1);
      }
      .search-indicator {
        font-size: 0.82rem;
        color: var(--text-3);
        font-style: italic;
      }
      .header-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .action-btn {
        padding: 0.6rem 0.9rem;
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.82rem;
        cursor: pointer;
        text-decoration: none;
        white-space: nowrap;
        transition: all 0.15s;
      }
      .action-btn:hover {
        background: var(--bg-card);
      }
      .action-btn.primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      .action-btn.primary:hover {
        filter: brightness(1.1);
      }
      .action-btn.danger:hover {
        background: #b42318;
        color: #fff;
        border-color: #b42318;
      }
      .state {
        color: var(--text-3);
        text-align: center;
        padding: 2rem;
      }
      .card {
        padding: 1.25rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .empty-state {
        text-align: center;
        padding: 3rem 2rem;
      }
      .empty-state h2 {
        color: var(--text-1);
        margin-bottom: 0.5rem;
      }
      .empty-state p {
        color: var(--text-2);
        margin-bottom: 1.5rem;
      }
      .empty-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      .load-more-btn {
        display: block;
        margin: 0 auto;
        padding: 0.7rem 1.5rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
      }
      .load-more-btn:hover {
        background: var(--bg-card);
      }

      /* Detail panel */
      .detail-panel {
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        overflow-y: auto;
        max-height: calc(100vh - 6rem);
        position: sticky;
        top: 1rem;
      }
      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border);
      }
      .detail-header h3 {
        margin: 0;
        font-size: 1rem;
        color: var(--text-1);
      }
      .close-detail {
        width: 1.8rem;
        height: 1.8rem;
        border: none;
        border-radius: 999px;
        background: var(--bg-surface);
        color: var(--text-2);
        cursor: pointer;
        display: grid;
        place-items: center;
      }
      .detail-body {
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
      }
      .detail-cover {
        width: 100%;
        height: 8rem;
        object-fit: cover;
        border-radius: 0.75rem;
      }
      .detail-meta {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .cat-badge {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 600;
      }
      .private-badge {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        background: var(--bg-surface);
        color: var(--text-3);
        font-size: 0.72rem;
      }
      .detail-summary {
        color: var(--text-2);
        font-size: 0.85rem;
        margin: 0;
        line-height: 1.5;
      }
      .detail-content {
        font-size: 0.82rem;
        color: var(--text-1);
        line-height: 1.6;
      }
      .detail-tags {
        display: flex;
        gap: 0.3rem;
        flex-wrap: wrap;
      }
      .tag-chip {
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        font-size: 0.68rem;
        color: var(--text-2);
      }
      .detail-actions {
        padding-top: 0.5rem;
      }

      @media (max-width: 960px) {
        .workspace {
          grid-template-columns: 1fr;
        }
        .workspace:has(.detail-panel) {
          grid-template-columns: 1fr;
        }
        .detail-panel {
          position: static;
          max-height: none;
        }
      }
    `,
  ],
})
export class WbWorkspacePageComponent {
  @ViewChild('categoryDialog') categoryDialog!: WbCategoryFormDialogComponent;
  @ViewChild('templateDialog') templateDialog!: WbTemplatePickerDialogComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly worldsService = inject(WorldsService);
  private readonly wbService = inject(WorldbuildingService);
  readonly markdownService = inject(MarkdownService);

  readonly worldSlug = signal('');
  readonly worldName = signal('');
  readonly categories = signal<WbCategorySummary[]>([]);
  readonly activeCategorySlug = signal<string | null>(null);
  readonly entries = signal<WbEntrySummary[]>([]);
  readonly loadingEntries = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMoreEntries = signal(false);
  readonly selectedEntry = signal<WbEntrySummary | null>(null);
  readonly entryDetail = signal<WbEntryDetail | null>(null);
  readonly loadingDetail = signal(false);
  readonly searchMode = signal(false);
  readonly searchTerm = signal('');
  readonly editingCategory = signal<WbCategory | null>(null);
  private nextCursor: string | null = null;

  activeCategoryName(): string {
    const slug = this.activeCategorySlug();
    if (!slug) return 'Todas las entradas';
    const cat = this.categories().find((c) => c.slug === slug);
    return cat ? cat.name : '';
  }

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.worldSlug.set(slug);
      this.worldsService.getBySlug(slug).subscribe({
        next: (world) => this.worldName.set(world.name),
        error: () => this.worldName.set('Mundo'),
      });
      this.loadCategories();
    });
  }

  onCategorySelected(catSlug: string | null) {
    this.activeCategorySlug.set(catSlug);
    this.searchMode.set(false);
    this.searchTerm.set('');
    this.selectedEntry.set(null);
    this.entryDetail.set(null);
    this.loadEntries();
  }

  onSearch(query: string) {
    if (!query) {
      this.searchMode.set(false);
      this.searchTerm.set('');
      this.loadEntries();
      return;
    }
    this.searchMode.set(true);
    this.searchTerm.set(query);
    this.loadingEntries.set(true);
    this.wbService.searchEntries(this.worldSlug(), query).subscribe({
      next: (res) => {
        this.entries.set(res.data);
        this.hasMoreEntries.set(res.pagination.hasMore);
        this.nextCursor = res.pagination.nextCursor;
        this.loadingEntries.set(false);
      },
      error: () => {
        this.entries.set([]);
        this.loadingEntries.set(false);
      },
    });
  }

  selectEntry(entry: WbEntrySummary) {
    this.selectedEntry.set(entry);
    this.loadingDetail.set(true);
    this.wbService.getEntry(this.worldSlug(), entry.slug).subscribe({
      next: (detail) => {
        this.entryDetail.set(detail);
        this.loadingDetail.set(false);
      },
      error: () => {
        this.entryDetail.set(null);
        this.loadingDetail.set(false);
      },
    });
  }

  editEntry(entry: WbEntrySummary) {
    void this.router.navigate([
      '/mis-mundos',
      this.worldSlug(),
      'world-building',
      entry.category.slug,
      entry.slug,
      'editar',
    ]);
  }

  deleteEntry(entry: WbEntrySummary) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar entrada',
          description: `Eliminar "${entry.name}"? Esta accion no se puede deshacer.`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
        },
      })
      .afterClosed()
      .pipe(
        filter((result) => result === 'true'),
        switchMap(() => this.wbService.deleteEntry(this.worldSlug(), entry.slug)),
      )
      .subscribe({
        next: () => {
          this.entries.update((list) => list.filter((e) => e.id !== entry.id));
          if (this.selectedEntry()?.id === entry.id) {
            this.selectedEntry.set(null);
            this.entryDetail.set(null);
          }
          this.loadCategories();
        },
      });
  }

  openCategoryDialog() {
    this.editingCategory.set(null);
    this.categoryDialog.open(null);
  }

  openCategoryEditDialog() {
    const catSlug = this.activeCategorySlug();
    if (!catSlug) return;
    this.wbService.getCategory(this.worldSlug(), catSlug).subscribe({
      next: (cat) => {
        this.editingCategory.set(cat);
        this.categoryDialog.open(cat);
      },
    });
  }

  openTemplateDialog() {
    this.templateDialog.open();
  }

  deleteActiveCategory() {
    const catSlug = this.activeCategorySlug();
    if (!catSlug) return;
    const cat = this.categories().find((c) => c.slug === catSlug);
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar categoria',
          description: `Eliminar la categoria "${cat?.name}"? Se eliminaran todas sus entradas.`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
        },
      })
      .afterClosed()
      .pipe(
        filter((result) => result === 'true'),
        switchMap(() => this.wbService.deleteCategory(this.worldSlug(), catSlug)),
      )
      .subscribe({
        next: () => {
          this.activeCategorySlug.set(null);
          this.loadCategories();
          this.loadEntries();
        },
      });
  }

  onCategorySaved() {
    this.loadCategories();
    if (this.activeCategorySlug()) {
      this.loadEntries();
    }
  }

  onDeleteLink(linkId: string) {
    const detail = this.entryDetail();
    if (!detail) return;
    this.wbService.deleteLink(this.worldSlug(), detail.slug, linkId).subscribe({
      next: () => {
        this.entryDetail.update((d) =>
          d ? { ...d, links: d.links.filter((l) => l.id !== linkId) } : d,
        );
      },
    });
  }

  onAddLink() {
    const detail = this.entryDetail();
    if (!detail) return;

    this.dialog
      .open(PromptDialogComponent, {
        width: '400px',
        data: {
          title: 'Vincular entrada',
          label: 'Nombre o slug de la entrada a vincular',
          placeholder: 'Ej: elfos-del-velo',
        } as PromptDialogData,
      })
      .afterClosed()
      .subscribe((targetName: string | null) => {
        if (!targetName) return;

        this.dialog
          .open(PromptDialogComponent, {
            width: '400px',
            data: {
              title: 'Tipo de relacion',
              label: 'Relacion',
              placeholder: 'Ej: es aliado de',
              value: 'relacionado con',
            } as PromptDialogData,
          })
          .afterClosed()
          .subscribe((relation: string | null) => {
            const rel = relation || 'relacionado con';

            this.wbService.searchEntries(this.worldSlug(), targetName).subscribe({
              next: (res) => {
                if (!res.data.length) {
                  this.showAlert(
                    'Sin resultados',
                    'No se encontro ninguna entrada con ese nombre.',
                  );
                  return;
                }
                const target = res.data[0];
                this.wbService
                  .createLink(this.worldSlug(), detail.slug, {
                    targetEntryId: target.id,
                    relation: rel,
                    isMutual: true,
                  })
                  .subscribe({
                    next: (link) => {
                      this.entryDetail.update((d) => (d ? { ...d, links: [...d.links, link] } : d));
                    },
                    error: () => this.showAlert('Error', 'No se pudo crear el vinculo.'),
                  });
              },
            });
          });
      });
  }

  private showAlert(title: string, message: string) {
    this.dialog.open(AlertDialogComponent, {
      width: '360px',
      data: { title, message } as AlertDialogData,
    });
  }

  loadMore() {
    if (!this.nextCursor || this.loadingMore()) return;
    this.loadingMore.set(true);

    const catSlug = this.activeCategorySlug();
    const req = catSlug
      ? this.wbService.listCategoryEntries(this.worldSlug(), catSlug, {
          cursor: this.nextCursor,
          limit: 20,
        })
      : this.wbService.listEntries(this.worldSlug(), { cursor: this.nextCursor, limit: 20 });

    req.pipe(finalize(() => this.loadingMore.set(false))).subscribe({
      next: (res) => {
        this.entries.update((current) => [...current, ...res.data]);
        this.hasMoreEntries.set(res.pagination.hasMore);
        this.nextCursor = res.pagination.nextCursor;
      },
    });
  }

  private loadCategories() {
    this.wbService.listCategories(this.worldSlug()).subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loadEntries();
      },
      error: () => {
        this.categories.set([]);
        this.entries.set([]);
      },
    });
  }

  private loadEntries() {
    this.loadingEntries.set(true);
    this.nextCursor = null;

    const catSlug = this.activeCategorySlug();
    const req = catSlug
      ? this.wbService.listCategoryEntries(this.worldSlug(), catSlug, { limit: 20 })
      : this.wbService.listEntries(this.worldSlug(), { limit: 20 });

    req.pipe(finalize(() => this.loadingEntries.set(false))).subscribe({
      next: (res) => {
        this.entries.set(res.data);
        this.hasMoreEntries.set(res.pagination.hasMore);
        this.nextCursor = res.pagination.nextCursor;
      },
      error: () => this.entries.set([]),
    });
  }
}
