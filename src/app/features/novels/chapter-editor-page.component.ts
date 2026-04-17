import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { ContentChange, QuillEditorComponent, QuillModules } from 'ngx-quill';
import { ChapterDetail } from '../../core/models/chapter.model';
import { ChaptersService } from '../../core/services/chapters.service';
import { MarkdownService } from '../../core/services/markdown.service';

@Component({
  selector: 'app-chapter-editor-page',
  standalone: true,
  imports: [FormsModule, RouterLink, QuillEditorComponent],
  template: `
    <section class="editor-shell">
      <header class="editor-topbar">
        <a [routerLink]="['/mis-novelas', slug, 'capitulos']">Volver a capitulos</a>

        <div class="meta">
          <span data-testid="word-count">{{ wordCount() }} palabras</span>
          @if (loading()) {
            <span>Cargando editor...</span>
          }
          @if (autosaving()) {
            <span>Guardando borrador...</span>
          }
          @if (savedAt()) {
            <span>Guardado {{ savedAt() }}</span>
          }
        </div>

        <div class="actions">
          <button
            type="button"
            (click)="save()"
            [disabled]="isBusy() || !title.trim() || !hasContent()"
          >
            {{
              saving()
                ? isCreate()
                  ? 'Creando...'
                  : 'Guardando...'
                : isCreate()
                  ? 'Crear'
                  : 'Guardar'
            }}
          </button>

          @if (!isCreate() && chapter()) {
            <button
              type="button"
              (click)="publish()"
              [disabled]="isBusy() || !title.trim() || !hasContent()"
            >
              {{ publishing() ? 'Publicando...' : 'Publicar' }}
            </button>
          }
        </div>
      </header>

      @if (statusMessage()) {
        <p class="status">{{ statusMessage() }}</p>
      }
      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }

      <section class="editor-pane">
        <input
          [(ngModel)]="title"
          placeholder="Titulo del capitulo"
          [disabled]="isBusy()"
          (ngModelChange)="onTitleChange()"
          data-testid="chapter-title"
        />

        <quill-editor
          class="chapter-quill"
          data-testid="chapter-content"
          format="html"
          [modules]="quillModules"
          [formats]="quillFormats"
          [(ngModel)]="content"
          [disabled]="isBusy()"
          [placeholder]="'Escribe tu capitulo aqui...'"
          (onContentChanged)="onContentChanged($event)"
        ></quill-editor>
      </section>
    </section>
  `,
  styles: [
    `
      .editor-shell,
      .editor-pane {
        display: grid;
        gap: 1rem;
        /* Evita que los hijos (incluido Quill) desborden el contenedor padre. */
        min-width: 0;
      }
      .editor-shell > *,
      .editor-pane > * {
        min-width: 0;
        max-width: 100%;
      }

      .editor-topbar,
      .meta,
      .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
      }

      .editor-topbar a {
        color: var(--accent-text);
        text-decoration: none;
      }
      .editor-topbar a:hover {
        color: var(--accent);
      }

      .editor-pane {
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }

      input,
      button {
        border-radius: 0.9rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.85rem 1rem;
      }

      input {
        width: 100%;
      }

      .status,
      .error {
        margin: 0;
        padding: 0.85rem 1rem;
        border-radius: 1rem;
      }

      .status {
        background: var(--accent-glow);
        color: var(--accent-text);
      }

      .error {
        background: color-mix(in srgb, #8b2e2e 18%, var(--bg-surface));
        color: #ffb3b3;
      }

      /* Adapta el tema 'snow' de Quill al theme de la app. */
      /* Layout flex: el host gobierna el alto total, la toolbar toma su alto
         natural y el container ocupa el resto. Asi el editor nunca sobrepasa
         a su padre. */
      :host ::ng-deep quill-editor.chapter-quill {
        display: flex;
        flex-direction: column;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        min-height: 480px;
      }
      :host ::ng-deep .chapter-quill .ql-toolbar.ql-snow,
      :host ::ng-deep .chapter-quill .ql-container.ql-snow {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        border-color: var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      :host ::ng-deep .chapter-quill .ql-toolbar.ql-snow {
        border-radius: 0.9rem 0.9rem 0 0;
        /* La toolbar puede tener muchos botones: que envuelvan, no que desborden. */
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.25rem;
        flex: 0 0 auto; /* alto natural, no crece ni se encoge */
        /* Se mantiene fija arriba mientras el escritor desplaza el contenido. */
        position: sticky;
        top: 0;
        z-index: 5;
        /* Fondo opaco para tapar el contenido que pasa por debajo. */
        background: var(--bg-card);
        backdrop-filter: blur(6px);
      }
      :host ::ng-deep .chapter-quill .ql-container.ql-snow {
        border-radius: 0 0 0.9rem 0.9rem;
        font-size: 1rem;
        line-height: 1.6;
        flex: 1 1 auto; /* ocupa el espacio restante del host */
        min-height: 0; /* anula min-height intrinsico que rompe flex */
        /* visible para que el editor crezca con el contenido y la pagina
           sea quien scrollee (necesario para que la toolbar sticky funcione). */
        overflow: visible;
      }
      :host ::ng-deep .chapter-quill .ql-editor {
        max-width: 100%;
        color: var(--text-1);
        /* Palabras o URLs largas no rompen el layout. */
        overflow-wrap: anywhere;
        word-break: break-word;
        /* Anula el overflow-y: auto por defecto de Quill: el contenido crece
           verticalmente y el scroll lo maneja la pagina, no el editor. */
        overflow-y: visible;
      }
      :host ::ng-deep .chapter-quill .ql-editor.ql-blank::before {
        color: var(--text-2);
        font-style: normal;
      }
      :host ::ng-deep .chapter-quill .ql-snow .ql-stroke {
        stroke: var(--text-1);
      }
      :host ::ng-deep .chapter-quill .ql-snow .ql-fill {
        fill: var(--text-1);
      }
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker {
        color: var(--text-1);
      }
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker-options {
        background: var(--bg-card);
        border-color: var(--border);
        color: var(--text-1);
      }

      /* === SIZE PICKER ESTILIZADO COMO LOS DROPDOWNS DE LA APP === */
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size {
        width: 132px;
        height: auto;
        font-size: 0.85rem;
      }
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-label {
        display: inline-flex;
        align-items: center;
        height: 32px;
        padding: 0 1.75rem 0 0.75rem;
        border: 1px solid var(--border);
        border-radius: 0.6rem;
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.85rem;
        line-height: 1;
        transition:
          border-color 120ms ease,
          color 120ms ease,
          background 120ms ease;
      }
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-label::before {
        line-height: 1;
      }
      /* Etiquetas en el label visible y en cada opcion. */
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-label::before,
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-item::before {
        content: 'Normal';
        font-size: inherit;
      }
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size
        .ql-picker-label[data-value='0.85rem']::before,
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size
        .ql-picker-item[data-value='0.85rem']::before {
        content: 'Pequeno';
      }
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size
        .ql-picker-label[data-value='1.25rem']::before,
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size
        .ql-picker-item[data-value='1.25rem']::before {
        content: 'Grande';
      }
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size
        .ql-picker-label[data-value='1.6rem']::before,
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size
        .ql-picker-item[data-value='1.6rem']::before {
        content: 'Muy grande';
      }
      /* Preview del tamano solo en las opciones del dropdown (no en el label). */
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size
        .ql-picker-item[data-value='0.85rem']::before {
        font-size: 0.85rem;
      }
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size
        .ql-picker-item[data-value='1.25rem']::before {
        font-size: 1.15rem;
      }
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size
        .ql-picker-item[data-value='1.6rem']::before {
        font-size: 1.35rem;
      }
      /* Reemplaza la flecha SVG nativa por un chevron CSS que use el theme. */
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-label svg {
        display: none;
      }
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-label::after {
        content: '';
        position: absolute;
        right: 0.7rem;
        top: 50%;
        width: 0.5rem;
        height: 0.5rem;
        margin-top: -0.35rem;
        border-right: 2px solid var(--text-2);
        border-bottom: 2px solid var(--text-2);
        transform: rotate(45deg);
        transition:
          transform 160ms ease,
          border-color 120ms ease;
      }
      :host
        ::ng-deep
        .chapter-quill
        .ql-snow
        .ql-picker.ql-size.ql-expanded
        .ql-picker-label::after {
        transform: rotate(-135deg);
        margin-top: -0.15rem;
        border-color: var(--accent-text);
      }
      /* Hover y abierto: borde acento, texto acento. */
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-label:hover,
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size.ql-expanded .ql-picker-label {
        border-color: var(--accent-text);
        color: var(--accent-text);
        background: var(--bg-surface);
      }
      /* Dropdown estilo card de la app. */
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-options {
        margin-top: 0.35rem;
        min-width: 160px;
        padding: 0.4rem;
        border: 1px solid var(--border);
        border-radius: 0.7rem;
        background: var(--bg-card);
        box-shadow: 0 12px 28px -16px var(--shadow);
      }
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-item {
        display: block;
        padding: 0.4rem 0.6rem;
        border-radius: 0.45rem;
        color: var(--text-1);
        cursor: pointer;
        transition: background 100ms ease;
      }
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-item:hover,
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-size .ql-picker-item.ql-selected {
        background: var(--accent-glow);
        color: var(--accent-text);
      }

      /* === ELIMINAR AZULES RESIDUALES DE QUILL EN TODA LA TOOLBAR === */
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:hover,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:focus,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button.ql-active,
      :host ::ng-deep .chapter-quill .ql-snow .ql-toolbar .ql-picker-label:hover,
      :host ::ng-deep .chapter-quill .ql-snow .ql-toolbar .ql-picker-label.ql-active,
      :host ::ng-deep .chapter-quill .ql-snow .ql-toolbar .ql-picker-item:hover,
      :host ::ng-deep .chapter-quill .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
        color: var(--accent-text);
      }
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:hover .ql-stroke,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:focus .ql-stroke,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button.ql-active .ql-stroke,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:hover .ql-stroke-miter,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:focus .ql-stroke-miter,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button.ql-active .ql-stroke-miter {
        stroke: var(--accent-text);
      }
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:hover .ql-fill,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:focus .ql-fill,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button.ql-active .ql-fill,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:hover .ql-stroke.ql-fill,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:focus .ql-stroke.ql-fill,
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button.ql-active .ql-stroke.ql-fill {
        fill: var(--accent-text);
      }
      /* Anula el color azul gris de Quill cuando el picker esta expandido. */
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-expanded .ql-picker-label,
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-stroke,
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-fill {
        color: var(--accent-text);
        stroke: var(--accent-text);
        fill: var(--accent-text);
      }
      /* Focus visible (teclado): outline acento, no halo azul nativo. */
      :host ::ng-deep .chapter-quill .ql-snow.ql-toolbar button:focus-visible,
      :host ::ng-deep .chapter-quill .ql-snow .ql-picker-label:focus-visible {
        outline: 2px solid var(--accent-text);
        outline-offset: 2px;
      }
    `,
  ],
})
export class ChapterEditorPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly chaptersService = inject(ChaptersService);
  private readonly markdownService = inject(MarkdownService);

  readonly isCreate = signal(true);
  readonly chapter = signal<ChapterDetail | null>(null);
  readonly wordCount = signal(0);
  readonly savedAt = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly publishing = signal(false);
  readonly autosaving = signal(false);
  readonly statusMessage = signal('');
  readonly errorMessage = signal('');
  readonly hasContent = signal(false);

  slug = '';
  chapterSlug: string | null = null;
  title = '';
  content = '';

  // Toolbar minimalista enfocada en escritura: negritas, cursivas, tamanos,
  // alineacion, sangria y listas. Sin colores, tablas, imagenes ni videos.
  readonly quillModules: QuillModules = {
    toolbar: [
      ['bold', 'italic'],
      [{ size: ['0.85rem', false, '1.25rem', '1.6rem'] }],
      [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ list: 'bullet' }, { list: 'ordered' }],
    ],
  };
  readonly quillFormats: string[] = ['bold', 'italic', 'size', 'align', 'indent', 'list'];

  private autosaveSub?: Subscription;
  private autosaveQueued = false;

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.slug = params.get('slug') ?? '';
      this.chapterSlug = params.get('chSlug');
      this.isCreate.set(!this.chapterSlug);
      this.statusMessage.set('');
      this.errorMessage.set('');
      this.savedAt.set('');
      this.loading.set(true);

      if (!this.chapterSlug) {
        this.title = '';
        this.content = '';
        this.hasContent.set(false);
        this.wordCount.set(0);
        this.loading.set(false);
        return;
      }

      this.chaptersService.getEditorChapter(this.slug, this.chapterSlug).subscribe({
        next: (chapter) => {
          this.chapter.set(chapter);
          this.title = chapter.title;
          // Compatibilidad: capitulos antiguos guardados como Markdown se
          // convierten a HTML al cargarlos en el editor WYSIWYG.
          this.content = this.toEditorHtml(chapter.content);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('No se pudo cargar el editor del capitulo.');
        },
      });
    });
  }

  ngOnDestroy() {
    this.autosaveSub?.unsubscribe();
  }

  onTitleChange() {
    this.scheduleAutosave();
  }

  onContentChanged(event: ContentChange) {
    const text = event.text ?? '';
    const trimmed = text.replace(/\s+/g, ' ').trim();
    this.wordCount.set(trimmed ? trimmed.split(' ').length : 0);
    this.hasContent.set(!!trimmed);
    this.scheduleAutosave();
  }

  private scheduleAutosave() {
    if (!this.chapterSlug) {
      return;
    }

    this.autosaveSub?.unsubscribe();
    this.autosaveSub = timer(1200).subscribe(() => this.runAutosave());
  }

  save() {
    if (this.isBusy() || !this.title.trim() || !this.hasContent()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.statusMessage.set(
      this.isCreate() ? 'Creando capitulo...' : 'Guardando cambios del capitulo...',
    );

    if (this.isCreate()) {
      this.chaptersService
        .create(this.slug, {
          title: this.title,
          content: this.content,
        })
        .subscribe({
          next: (chapter) => {
            this.saving.set(false);
            this.statusMessage.set('Capitulo creado. Abriendo editor...');
            this.router.navigate(['/mis-novelas', this.slug, 'capitulos', chapter.slug, 'editar']);
          },
          error: () => {
            this.saving.set(false);
            this.statusMessage.set('');
            this.errorMessage.set('No se pudo crear el capitulo. Intenta de nuevo.');
          },
        });

      return;
    }

    this.chaptersService
      .update(this.slug, this.chapterSlug!, {
        title: this.title,
        content: this.content,
      })
      .subscribe({
        next: (chapter) => {
          this.chapter.set(chapter);
          this.savedAt.set(new Date().toLocaleTimeString());
          this.saving.set(false);
          this.statusMessage.set('Capitulo guardado correctamente.');
        },
        error: () => {
          this.saving.set(false);
          this.statusMessage.set('');
          this.errorMessage.set('No se pudo guardar el capitulo. Intenta de nuevo.');
        },
      });
  }

  publish() {
    if (!this.chapterSlug || this.isBusy()) {
      return;
    }

    this.publishing.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('Publicando capitulo...');

    this.chaptersService.publish(this.slug, this.chapterSlug).subscribe({
      next: (chapter) => {
        this.chapter.set(chapter);
        this.savedAt.set(new Date().toLocaleTimeString());
        this.publishing.set(false);
        this.statusMessage.set('Capitulo publicado y visible para lectores.');
      },
      error: () => {
        this.publishing.set(false);
        this.statusMessage.set('');
        this.errorMessage.set('No se pudo publicar el capitulo. Intenta de nuevo.');
      },
    });
  }

  isBusy() {
    return this.loading() || this.saving() || this.publishing();
  }

  private runAutosave() {
    if (!this.chapterSlug) {
      return;
    }

    if (this.isBusy()) {
      this.autosaveQueued = true;
      return;
    }

    this.autosaving.set(true);
    this.autosaveQueued = false;

    this.chaptersService
      .autosave(this.slug, this.chapterSlug, {
        title: this.title,
        content: this.content,
      })
      .subscribe({
        next: (result) => {
          this.savedAt.set(new Date(result.savedAt).toLocaleTimeString());
          this.wordCount.set(result.wordCount);
          this.autosaving.set(false);

          if (this.autosaveQueued) {
            this.runAutosave();
          }
        },
        error: () => {
          this.autosaving.set(false);
          this.errorMessage.set('No se pudo guardar el borrador automaticamente.');
        },
      });
  }

  private toEditorHtml(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    // Si el contenido ya parece HTML, lo entregamos tal cual.
    if (/<[a-zA-Z][\s\S]*>/.test(value)) {
      return value;
    }
    // Caso legacy: el contenido es Markdown -> convertimos a HTML.
    return this.markdownService.render(value);
  }
}
