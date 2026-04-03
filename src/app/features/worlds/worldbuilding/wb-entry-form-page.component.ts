import { Component, HostListener, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WbEntryDetail } from '../../../core/models/wb-entry.model';
import { WbCategory } from '../../../core/models/wb-category.model';
import { FieldDefinition } from '../../../core/models/field-definition.model';
import { WorldbuildingService } from '../../../core/services/worldbuilding.service';
import { MarkdownService } from '../../../core/services/markdown.service';
import { WbDynamicFieldComponent } from './components/wb-dynamic-field.component';
import { WbEntryLinksComponent } from './components/wb-entry-links.component';

@Component({
  selector: 'app-wb-entry-form-page',
  standalone: true,
  imports: [FormsModule, RouterLink, WbDynamicFieldComponent, WbEntryLinksComponent],
  template: `
    <div class="form-page">
      <header class="topbar">
        <div class="topbar-left">
          <a class="back-btn" [routerLink]="['/mis-mundos', worldSlug(), 'world-building']">&#8592; Volver</a>
          <div class="title-area">
            <input
              type="text"
              class="name-input"
              [(ngModel)]="name"
              name="name"
              placeholder="Nombre de la entrada"
              (ngModelChange)="markDirty()"
            />
            @if (category()) {
              <span class="cat-badge" [style.background]="(category()!.color || '#6366f1') + '22'" [style.color]="category()!.color || '#6366f1'">
                {{ category()!.icon }} {{ category()!.name }}
              </span>
            }
          </div>
        </div>
        <div class="topbar-right">
          @if (autoSaveMsg()) {
            <span class="save-indicator">{{ autoSaveMsg() }}</span>
          }
          <label class="toggle-public">
            <input type="checkbox" [(ngModel)]="isPublic" name="isPublic" (ngModelChange)="markDirty()" />
            <span>{{ isPublic ? 'Publico' : 'Privado' }}</span>
          </label>
          <button type="button" class="save-btn" (click)="save()" [disabled]="saving() || !name.trim()">
            {{ saving() ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </header>

      @if (loading()) {
        <p class="state">Cargando...</p>
      } @else {
        <form class="editor-layout" (ngSubmit)="save()">
          <div class="left-col">
            <label>
              <span>Resumen</span>
              <textarea [(ngModel)]="summary" name="summary" rows="3" placeholder="Breve descripcion..." (ngModelChange)="markDirty()"></textarea>
            </label>

            <label>
              <span>URL de portada</span>
              <input type="url" [(ngModel)]="coverUrl" name="coverUrl" placeholder="https://..." (ngModelChange)="markDirty()" />
            </label>

            <div class="content-section">
              <div class="content-header-row">
                <span>Contenido</span>
                <div class="content-tabs">
                  <button type="button" class="tab-btn" [class.active]="!showContentPreview()" (click)="showContentPreview.set(false)">Editar</button>
                  <button type="button" class="tab-btn" [class.active]="showContentPreview()" (click)="showContentPreview.set(true)">Preview</button>
                </div>
              </div>
              @if (!showContentPreview()) {
                <textarea [(ngModel)]="content" name="content" rows="16" placeholder="Escribe en Markdown..." (ngModelChange)="markDirty()"></textarea>
              } @else {
                <div class="content-preview" [innerHTML]="markdownService.render(content || 'Sin contenido.')"></div>
              }
            </div>

            @if (errorMsg()) {
              <p class="error-msg">{{ errorMsg() }}</p>
            }
            @if (successMsg()) {
              <p class="success-msg">{{ successMsg() }}</p>
            }
          </div>

          <div class="right-col">
            @if (fieldSchema().length) {
              <div class="fields-section card">
                <h3>Campos</h3>
                @for (fieldDef of fieldSchema(); track fieldDef.key) {
                  <app-wb-dynamic-field
                    [fieldDef]="fieldDef"
                    [value]="fields()[fieldDef.key]"
                    (valueChange)="onFieldChange(fieldDef.key, $event)"
                  />
                }
              </div>
            }

            <div class="tags-section card">
              <h3>Tags</h3>
              <input
                type="text"
                [(ngModel)]="tagsRaw"
                name="tagsRaw"
                placeholder="magia, importante, lore"
                (ngModelChange)="markDirty()"
              />
            </div>

            @if (isEdit()) {
              <div class="links-section card">
                <app-wb-entry-links
                  [links]="links()"
                  [isOwner]="true"
                  (deleteLink)="onDeleteLink($event)"
                  (addLink)="onAddLink()"
                />
              </div>
            }
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-page { display: grid; gap: 0; min-height: 100vh; grid-template-rows: auto 1fr; }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--border);
      background: var(--bg-card);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .topbar-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
    .topbar-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .back-btn {
      padding: 0.5rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-1);
      text-decoration: none;
      font-size: 0.82rem;
      white-space: nowrap;
    }
    .title-area { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
    .name-input {
      flex: 1;
      min-width: 10rem;
      padding: 0.5rem 0.75rem;
      border: none;
      background: transparent;
      color: var(--text-1);
      font-size: 1.15rem;
      font-weight: 600;
    }
    .name-input:focus { outline: none; border-bottom: 2px solid var(--accent-glow); }
    .cat-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .save-indicator { font-size: 0.75rem; color: var(--text-3); }
    .toggle-public {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.82rem;
      color: var(--text-2);
      cursor: pointer;
    }
    .toggle-public input { accent-color: var(--accent-text); }
    .save-btn {
      padding: 0.6rem 1.2rem;
      border-radius: 1rem;
      border: none;
      background: var(--accent-glow);
      color: var(--accent-text);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .state { color: var(--text-3); text-align: center; padding: 3rem; }
    .editor-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.25rem;
      padding: 1.25rem;
      align-items: start;
    }
    .left-col, .right-col { display: grid; gap: 1rem; }
    .card {
      padding: 1rem;
      border-radius: 1.25rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
      display: grid;
      gap: 0.75rem;
    }
    .card h3 { margin: 0; font-size: 0.92rem; color: var(--text-1); }
    label { display: grid; gap: 0.35rem; }
    label span { font-size: 0.82rem; color: var(--text-2); }
    input, textarea, select {
      padding: 0.7rem 0.85rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-1);
      font-size: 0.85rem;
      width: 100%;
      box-sizing: border-box;
    }
    input:focus, textarea:focus { outline: 1px solid var(--accent-glow); }
    .content-section { display: grid; gap: 0.35rem; }
    .content-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .content-header-row > span { font-size: 0.82rem; color: var(--text-2); }
    .content-tabs { display: flex; gap: 0; }
    .tab-btn {
      padding: 0.35rem 0.7rem;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-3);
      font-size: 0.75rem;
      cursor: pointer;
    }
    .tab-btn:first-child { border-radius: 0.5rem 0 0 0.5rem; }
    .tab-btn:last-child { border-radius: 0 0.5rem 0.5rem 0; }
    .tab-btn.active { background: var(--accent-glow); color: var(--accent-text); }
    .content-preview {
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      background: var(--bg-surface);
      min-height: 20rem;
      font-size: 0.85rem;
      line-height: 1.6;
      color: var(--text-1);
    }
    .error-msg { color: #b42318; font-size: 0.82rem; margin: 0; }
    .success-msg { color: #027a48; font-size: 0.82rem; margin: 0; }
    @media (max-width: 960px) {
      .editor-layout { grid-template-columns: 1fr; }
    }
  `],
})
export class WbEntryFormPageComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly wbService = inject(WorldbuildingService);
  readonly markdownService = inject(MarkdownService);

  readonly worldSlug = signal('');
  readonly isEdit = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);
  readonly autoSaveMsg = signal<string | null>(null);
  readonly showContentPreview = signal(false);
  readonly category = signal<WbCategory | null>(null);
  readonly fieldSchema = signal<FieldDefinition[]>([]);
  readonly fields = signal<Record<string, any>>({});
  readonly links = signal<any[]>([]);

  private entrySlug: string | null = null;
  private catSlug: string | null = null;
  private dirty = false;
  private autoSaveTimer: any = null;

  name = '';
  summary = '';
  content = '';
  coverUrl = '';
  tagsRaw = '';
  isPublic = false;

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.dirty) {
      event.preventDefault();
    }
  }

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      const catSlug = params.get('catSlug');
      const entrySlug = params.get('entrySlug');

      if (!slug || !catSlug) return;
      this.worldSlug.set(slug);
      this.catSlug = catSlug;
      this.entrySlug = entrySlug || null;
      this.isEdit.set(Boolean(entrySlug));

      this.wbService.getCategory(slug, catSlug).subscribe({
        next: (cat) => {
          this.category.set(cat);
          this.fieldSchema.set(cat.fieldSchema || []);
          if (entrySlug) {
            this.loadEntry(slug, entrySlug);
          } else {
            this.initDefaults();
            this.loading.set(false);
          }
        },
        error: () => {
          this.loading.set(false);
          this.errorMsg.set('No se pudo cargar la categoria.');
        },
      });
    });

    this.autoSaveTimer = setInterval(() => {
      if (this.dirty && this.isEdit() && this.entrySlug && this.name.trim()) {
        this.autoSave();
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
  }

  markDirty() {
    this.dirty = true;
    this.autoSaveMsg.set(null);
  }

  onFieldChange(key: string, value: any) {
    this.fields.update((f) => ({ ...f, [key]: value }));
    this.markDirty();
  }

  save() {
    if (this.saving() || !this.name.trim()) return;
    this.saving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const payload = this.buildPayload();

    const req = this.isEdit() && this.entrySlug
      ? this.wbService.updateEntry(this.worldSlug(), this.entrySlug!, payload)
      : this.wbService.createEntry(this.worldSlug(), {
          ...payload,
          categoryId: this.category()!.id,
        });

    req.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (entry) => {
        this.dirty = false;
        this.successMsg.set('Entrada guardada correctamente.');
        this.autoSaveMsg.set(null);
        if (!this.isEdit()) {
          this.isEdit.set(true);
          this.entrySlug = entry.slug;
          this.links.set(entry.links || []);
          void this.router.navigate(
            ['/mis-mundos', this.worldSlug(), 'world-building', this.catSlug, entry.slug, 'editar'],
            { replaceUrl: true },
          );
        }
      },
      error: () => this.errorMsg.set('No se pudo guardar la entrada.'),
    });
  }

  onDeleteLink(linkId: string) {
    if (!this.entrySlug) return;
    this.wbService.deleteLink(this.worldSlug(), this.entrySlug, linkId).subscribe({
      next: () => this.links.update((l) => l.filter((link) => link.id !== linkId)),
    });
  }

  onAddLink() {
    if (!this.entrySlug) return;
    const targetName = prompt('Nombre o slug de la entrada a vincular:');
    if (!targetName) return;
    const relation = prompt('Relacion (ej: "es aliado de"):') || 'relacionado con';

    this.wbService.searchEntries(this.worldSlug(), targetName).subscribe({
      next: (res) => {
        if (!res.data.length) {
          alert('No se encontro ninguna entrada con ese nombre.');
          return;
        }
        const target = res.data[0];
        this.wbService.createLink(this.worldSlug(), this.entrySlug!, {
          targetEntryId: target.id,
          relation,
          isMutual: true,
        }).subscribe({
          next: (link) => this.links.update((l) => [...l, link]),
          error: () => alert('No se pudo crear el vinculo.'),
        });
      },
    });
  }

  private loadEntry(worldSlug: string, entrySlug: string) {
    this.wbService.getEntry(worldSlug, entrySlug).subscribe({
      next: (entry) => {
        this.name = entry.name;
        this.summary = entry.summary || '';
        this.content = entry.content || '';
        this.coverUrl = entry.coverUrl || '';
        this.tagsRaw = (entry.tags || []).join(', ');
        this.isPublic = entry.isPublic;
        this.fields.set(entry.fields || {});
        this.links.set(entry.links || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('No se pudo cargar la entrada.');
      },
    });
  }

  private initDefaults() {
    this.name = '';
    this.summary = '';
    this.content = '';
    this.coverUrl = '';
    this.tagsRaw = '';
    this.isPublic = false;
    const defaults: Record<string, any> = {};
    for (const field of this.fieldSchema()) {
      if (field.default !== null && field.default !== undefined) {
        defaults[field.key] = field.default;
      }
    }
    this.fields.set(defaults);
  }

  private autoSave() {
    if (this.saving()) return;
    this.autoSaveMsg.set('Guardando automaticamente...');

    const payload = this.buildPayload();
    this.wbService.updateEntry(this.worldSlug(), this.entrySlug!, payload).subscribe({
      next: () => {
        this.dirty = false;
        this.autoSaveMsg.set('Guardado automaticamente');
        setTimeout(() => {
          if (this.autoSaveMsg() === 'Guardado automaticamente') {
            this.autoSaveMsg.set(null);
          }
        }, 3000);
      },
      error: () => this.autoSaveMsg.set('Error al guardar'),
    });
  }

  private buildPayload() {
    return {
      name: this.name.trim(),
      summary: this.summary.trim() || null,
      content: this.content.trim() || null,
      coverUrl: this.coverUrl.trim() || null,
      fields: this.fields(),
      tags: this.tagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
      isPublic: this.isPublic,
    };
  }
}
