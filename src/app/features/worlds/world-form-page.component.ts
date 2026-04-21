import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { NovelSummary } from '../../core/models/novel.model';
import { MarkdownService } from '../../core/services/markdown.service';
import { NovelsService } from '../../core/services/novels.service';
import { WorldsService } from '../../core/services/worlds.service';
import { WorldGenre, WorldVisibility, WORLD_GENRE_LABELS } from '../../core/models/world.model';
import { TagChipsInputComponent } from '../../shared/components/tag-chips-input/tag-chips-input.component';

@Component({
  selector: 'app-world-form-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TagChipsInputComponent],
  template: `
    <section class="form-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Autor</p>
          <h1>{{ isEdit() ? 'Editar mundo' : 'Nuevo mundo' }}</h1>
          <p class="lede">Documenta ambientacion, reglas y tono general con Markdown.</p>
        </div>
        <div class="header-actions">
          @if (isEdit()) {
            <a class="back-link" [routerLink]="['/mis-mundos', currentSlug, 'mapa']"
              >Edicion de mapas</a
            >
            <a class="back-link" [routerLink]="['/mis-mundos', currentSlug, 'world-building']"
              >Gestionar world-building</a
            >
          }
          <a class="back-link" routerLink="/mis-mundos">Volver</a>
        </div>
      </header>

      <form class="editor-grid" (ngSubmit)="submit()">
        <section class="card form-pane">
          <label
            ><span>Nombre</span
            ><input [(ngModel)]="name" name="name" required [disabled]="saving()"
          /></label>
          <label
            ><span>Tagline</span><input [(ngModel)]="tagline" name="tagline" [disabled]="saving()"
          /></label>
          <label
            ><span>Visibilidad</span>
            <select [(ngModel)]="visibility" name="visibility" [disabled]="saving()">
              <option value="PRIVATE">Privado</option>
              <option value="PUBLIC">Publico</option>
            </select>
          </label>
          <label
            ><span>Genero</span>
            <select [(ngModel)]="genre" name="genre" [disabled]="saving()">
              <option [ngValue]="null">Sin genero</option>
              @for (option of genreOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </label>
          <div class="field-group">
            <span>Tags</span>
            <app-tag-chips-input
              [tags]="tags"
              [maxTags]="20"
              placeholder="Anadir tag y presionar Enter..."
              (tagsChange)="onTagsChange($event)"
            />
          </div>
          <label
            ><span>Imagen del mundo (URL)</span
            ><input
              type="url"
              [(ngModel)]="coverUrl"
              name="coverUrl"
              placeholder="https://ejemplo.com/imagen.jpg"
              [disabled]="saving()"
          /></label>
          @if (coverUrl) {
            <div class="cover-preview">
              <img [src]="coverUrl" alt="Vista previa" />
            </div>
          }
          <section class="editor-field">
            <div class="editor-heading">
              <div>
                <span>Documento del mundo</span>
                <small
                  >Un solo documento con Markdown para descripcion, ambientacion, sistema y
                  reglas.</small
                >
              </div>
              <div class="toolbar">
                <button type="button" (click)="applyBlock('h2')" [disabled]="saving()">H2</button>
                <button type="button" (click)="applyBlock('h3')" [disabled]="saving()">H3</button>
                <button
                  type="button"
                  (click)="applyWrap('**', '**', 'texto en negrita')"
                  [disabled]="saving()"
                >
                  B
                </button>
                <button
                  type="button"
                  (click)="applyWrap('*', '*', 'texto en cursiva')"
                  [disabled]="saving()"
                >
                  I
                </button>
                <button
                  type="button"
                  (click)="applyWrap('[', '](https://ejemplo.com)', 'enlace')"
                  [disabled]="saving()"
                >
                  Link
                </button>
                <button type="button" (click)="applyBlock('quote')" [disabled]="saving()">
                  Cita
                </button>
                <button type="button" (click)="applyBlock('list')" [disabled]="saving()">
                  Lista
                </button>
                <button type="button" (click)="applyBlock('table')" [disabled]="saving()">
                  Tabla
                </button>
                <button type="button" (click)="applyBlock('separator')" [disabled]="saving()">
                  ---
                </button>
              </div>
            </div>

            <div class="template-row">
              @for (template of editorTemplates; track template.label) {
                <button
                  type="button"
                  class="template-chip"
                  (click)="insertTemplate(template.content)"
                  [disabled]="saving()"
                >
                  {{ template.label }}
                </button>
              }
            </div>

            <textarea
              id="world-profile-editor"
              [(ngModel)]="worldContent"
              name="worldContent"
              rows="18"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
              placeholder="# Nombre del mundo&#10;&#10;## Descripcion general&#10;&#10;## Ambientacion&#10;&#10;## Sistema de magia&#10;&#10;## Reglas"
            ></textarea>
          </section>

          <fieldset class="linked-block">
            <legend>Novelas vinculadas</legend>
            @if (!eligibleNovels().length) {
              <p class="hint">
                No tienes novelas compatibles disponibles. Puedes vincular originales y fanfics
                marcados como AU.
              </p>
            } @else {
              <div class="linked-selector">
                <select
                  [(ngModel)]="pendingNovelSlug"
                  name="pendingNovelSlug"
                  [disabled]="saving()"
                  (ngModelChange)="selectNovel($event)"
                >
                  <option value="">Selecciona una novela</option>
                  @for (novel of availableNovels(); track novel.slug) {
                    <option [value]="novel.slug">{{ novel.title }}</option>
                  }
                </select>
              </div>

              @if (selectedNovels().length) {
                <div class="selected-items">
                  @for (novel of selectedNovels(); track novel.slug) {
                    <button
                      type="button"
                      class="linked-pill"
                      [disabled]="saving()"
                      (click)="removeNovel(novel.slug)"
                    >
                      <span>{{ novel.title }}</span>
                      <strong>×</strong>
                    </button>
                  }
                </div>
              } @else {
                <p class="hint">Todavia no has vinculado novelas a este mundo.</p>
              }
            }
          </fieldset>

          @if (message()) {
            <p class="feedback success">{{ message() }}</p>
          }
          @if (error()) {
            <p class="feedback error">{{ error() }}</p>
          }

          <div class="actions">
            <button type="button" class="secondary" routerLink="/mis-mundos" [disabled]="saving()">
              Cancelar
            </button>
            <button type="submit" [disabled]="saving() || !name.trim()">
              {{ saving() ? 'Guardando...' : isEdit() ? 'Guardar cambios' : 'Crear mundo' }}
            </button>
          </div>
        </section>

        <aside class="card preview-pane">
          <h2>Preview</h2>
          <div [innerHTML]="previewHtml()"></div>
        </aside>
      </form>
    </section>
  `,
  styles: [
    `
      .form-shell,
      .editor-grid,
      .form-pane,
      .linked-block,
      .linked-selector {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.25rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .cover-preview {
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        overflow: hidden;
      }
      .cover-preview img {
        width: 100%;
        height: 140px;
        object-fit: cover;
        display: block;
      }
      .hero {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .header-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .editor-grid {
        grid-template-columns: 1.1fr 0.9fr;
      }
      .eyebrow,
      .lede,
      label span {
        color: var(--text-2);
      }
      label {
        display: grid;
        gap: 0.45rem;
      }
      .field-group {
        display: grid;
        gap: 0.45rem;
      }
      .hint,
      .editor-heading small {
        margin: 0;
        color: var(--text-2);
      }
      .editor-field,
      .editor-heading {
        display: grid;
        gap: 0.75rem;
      }
      .toolbar,
      .template-row {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
      }
      .toolbar button,
      .template-chip {
        min-height: 2.25rem;
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: color-mix(in srgb, var(--bg-surface) 90%, white 10%);
        color: var(--text-1);
        cursor: pointer;
      }
      .template-chip {
        background: color-mix(in srgb, var(--accent-glow) 26%, var(--bg-surface));
      }
      input,
      select,
      textarea,
      .actions button,
      .back-link {
        padding: 0.85rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .actions button,
      .back-link {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .secondary {
        background: transparent !important;
        color: var(--text-1) !important;
      }
      .feedback.success {
        color: #027a48;
      }
      .feedback.error {
        color: #b42318;
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
      @media (max-width: 960px) {
        .editor-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WorldFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly worldsService = inject(WorldsService);
  private readonly novelsService = inject(NovelsService);
  private readonly markdownService = inject(MarkdownService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly previewHtml = signal('');
  readonly novels = signal<NovelSummary[]>([]);
  readonly eligibleNovels = computed(() =>
    this.novels().filter(
      (novel) =>
        (novel.novelType ?? 'ORIGINAL') === 'ORIGINAL' ||
        ((novel.novelType ?? 'ORIGINAL') === 'FANFIC' && Boolean(novel.isAlternateUniverse)),
    ),
  );
  readonly selectedNovelSlugs = signal<string[]>([]);
  readonly initialNovelSlugs = signal<string[]>([]);
  readonly availableNovels = computed(() =>
    this.eligibleNovels().filter((novel) => !this.selectedNovelSlugs().includes(novel.slug)),
  );
  readonly selectedNovels = computed(() => {
    const selected = new Set(this.selectedNovelSlugs());
    return this.novels().filter((novel) => selected.has(novel.slug));
  });

  currentSlug: string | null = null;

  readonly genreOptions = Object.entries(WORLD_GENRE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  readonly editorTemplates = [
    {
      label: 'Mundo wiki',
      content:
        '# Nombre del mundo\n\n## Descripcion general\n\nResume el tono, la identidad y el conflicto principal del mundo.\n\n## Ambientacion\n\n### Geografia\n\n### Cultura\n\n### Politica\n\n## Sistema de magia\n\n- Fuente\n- Limites\n- Costos\n\n## Reglas del mundo\n\n- Regla 1\n- Regla 2',
    },
    {
      label: 'Reino o imperio',
      content:
        '## Identidad del reino\n| Campo | Valor |\n| --- | --- |\n| Nombre oficial |  |\n| Capital |  |\n| Gobierno |  |\n| Idioma |  |\n\n## Historia\n\n## Estructura social\n\n## Fuerza militar\n\n## Tensiones actuales',
    },
    {
      label: 'Sistema magico',
      content:
        '## Sistema de magia\n\n### Origen\n\n### Quienes pueden usarlo\n\n### Costos\n\n### Limites\n\n### Riesgos\n\n### Variantes conocidas',
    },
  ];

  name = '';
  tagline = '';
  worldContent = '';
  tags: string[] = [];
  coverUrl = '';
  genre: WorldGenre | null = null;
  visibility: WorldVisibility = 'PRIVATE';
  pendingNovelSlug = '';

  constructor() {
    this.novelsService.listMine({ limit: 50, sort: 'recent' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.novels.set(response.data),
      error: () => this.novels.set([]),
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      this.isEdit.set(Boolean(slug));
      this.currentSlug = slug;
      if (!slug) {
        this.refreshPreview();
        return;
      }

      this.worldsService.getBySlug(slug).subscribe((world) => {
        this.name = world.name;
        this.tagline = world.tagline ?? '';
        this.worldContent = this.composeWorldContent(world);
        this.tags = world.tags ?? [];
        this.coverUrl = world.coverUrl ?? '';
        this.genre = world.genre;
        this.visibility = world.visibility;
        this.selectedNovelSlugs.set(world.linkedNovels.map((novel) => novel.slug));
        this.initialNovelSlugs.set(world.linkedNovels.map((novel) => novel.slug));
        this.refreshPreview();
      });
    });
  }

  selectNovel(novelSlug: string) {
    if (!novelSlug || this.selectedNovelSlugs().includes(novelSlug)) {
      this.pendingNovelSlug = '';
      return;
    }

    this.selectedNovelSlugs.update((current) => [...current, novelSlug]);
    this.pendingNovelSlug = '';
  }

  removeNovel(novelSlug: string) {
    this.selectedNovelSlugs.update((current) => current.filter((slug) => slug !== novelSlug));
  }

  onTagsChange(tags: string[]) {
    this.tags = tags;
  }

  submit() {
    if (this.saving() || !this.name.trim()) return;
    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    const payload = {
      name: this.name.trim(),
      tagline: this.tagline.trim() || null,
      description: this.worldContent.trim() || null,
      setting: null,
      magicSystem: null,
      rules: null,
      coverUrl: this.coverUrl.trim() || null,
      genre: this.genre,
      visibility: this.visibility,
      tags: this.tags,
    };

    const request =
      this.isEdit() && this.currentSlug
        ? this.worldsService.update(this.currentSlug, payload)
        : this.worldsService.create(payload);

    request.pipe(switchMap((world) => this.syncNovelLinks(world.slug, world))).subscribe({
      next: (world) => {
        this.saving.set(false);
        this.initialNovelSlugs.set(this.selectedNovelSlugs());
        this.message.set('Mundo guardado correctamente.');
        void this.router.navigate(['/mis-mundos', world.slug, 'editar']);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('No se pudo guardar el mundo.');
      },
    });
  }

  refreshPreview() {
    this.previewHtml.set(
      this.markdownService.render(this.worldContent.trim() || 'Sin contenido todavia.'),
    );
  }

  applyWrap(prefix: string, suffix: string, placeholder: string) {
    this.insertAtSelection((selected) => `${prefix}${selected || placeholder}${suffix}`);
  }

  applyBlock(type: 'h2' | 'h3' | 'quote' | 'list' | 'table' | 'separator') {
    const blocks: Record<'h2' | 'h3' | 'quote' | 'list' | 'table' | 'separator', string> = {
      h2: '## Nueva seccion',
      h3: '### Subtitulo',
      quote: '> Fragmento, regla o cita del mundo',
      list: '- Punto 1\n- Punto 2\n- Punto 3',
      table: '| Campo | Valor |\n| --- | --- |\n| Dato |  |',
      separator: '---',
    };
    this.insertAtSelection((selected) =>
      selected ? `${selected}\n\n${blocks[type]}` : blocks[type],
    );
  }

  insertTemplate(content: string) {
    this.insertAtSelection((selected) => (selected ? `${selected}\n\n${content}` : content));
  }

  private syncNovelLinks(worldSlug: string, world: { slug: string }) {
    const selectedSlugs = new Set(this.selectedNovelSlugs());
    const currentSlugs = new Set(this.initialNovelSlugs());

    const toLink = [...selectedSlugs].filter((slug) => !currentSlugs.has(slug));
    const toUnlink = [...currentSlugs].filter((slug) => !selectedSlugs.has(slug));

    const operations = [
      ...toLink.map((novelSlug) => this.worldsService.linkNovel(worldSlug, novelSlug)),
      ...toUnlink.map((novelSlug) => this.worldsService.unlinkNovel(worldSlug, novelSlug)),
    ];

    return operations.length ? forkJoin(operations).pipe(switchMap(() => of(world))) : of(world);
  }

  private insertAtSelection(transform: (selected: string) => string) {
    const textarea = document.getElementById('world-profile-editor') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart ?? this.worldContent.length;
    const end = textarea.selectionEnd ?? this.worldContent.length;
    const selected = this.worldContent.slice(start, end);
    const replacement = transform(selected);
    this.worldContent =
      this.worldContent.slice(0, start) + replacement + this.worldContent.slice(end);
    this.refreshPreview();

    queueMicrotask(() => {
      textarea.focus();
      const caret = start + replacement.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  private composeWorldContent(world: {
    description: string | null;
    setting: string | null;
    magicSystem: string | null;
    rules: string | null;
  }) {
    const hasLegacyStructure =
      Boolean(world.setting) || Boolean(world.magicSystem) || Boolean(world.rules);

    if (!hasLegacyStructure && world.description) {
      return world.description;
    }

    return [
      world.description && `## Descripcion\n${world.description}`,
      world.setting && `## Ambientacion\n${world.setting}`,
      world.magicSystem && `## Sistema de magia\n${world.magicSystem}`,
      world.rules && `## Reglas\n${world.rules}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }
}
