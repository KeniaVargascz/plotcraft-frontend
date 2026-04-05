import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { ChapterDetail } from '../../core/models/chapter.model';
import { ChaptersService } from '../../core/services/chapters.service';
import { MarkdownService } from '../../core/services/markdown.service';

@Component({
  selector: 'app-chapter-editor-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
            [disabled]="isBusy() || !title.trim() || !content.trim()"
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
              [disabled]="isBusy() || !title.trim() || !content.trim()"
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

      <div class="editor-grid">
        <section class="editor-pane">
          <input
            [(ngModel)]="title"
            placeholder="Titulo del capitulo"
            [disabled]="isBusy()"
            (ngModelChange)="onChange()"
            data-testid="chapter-title"
          />

          <textarea
            [(ngModel)]="content"
            rows="24"
            placeholder="Escribe tu capitulo en Markdown"
            [disabled]="isBusy()"
            (ngModelChange)="onChange()"
            data-testid="chapter-content"
          ></textarea>
        </section>

        <aside class="preview-pane">
          <h3>Preview</h3>
          <div [innerHTML]="previewHtml()"></div>
        </aside>
      </div>
    </section>
  `,
  styles: [
    `
      .editor-shell,
      .editor-pane {
        display: grid;
        gap: 1rem;
      }

      .editor-topbar,
      .meta,
      .actions,
      .editor-grid {
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
      }

      .editor-grid {
        align-items: start;
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
      }

      .editor-pane,
      .preview-pane {
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }

      input,
      textarea,
      button {
        width: 100%;
        border-radius: 0.9rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.85rem 1rem;
      }

      button {
        width: auto;
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

      @media (max-width: 960px) {
        .editor-grid {
          grid-template-columns: 1fr;
        }
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
  readonly previewHtml = signal('');
  readonly wordCount = signal(0);
  readonly savedAt = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly publishing = signal(false);
  readonly autosaving = signal(false);
  readonly statusMessage = signal('');
  readonly errorMessage = signal('');

  slug = '';
  chapterSlug: string | null = null;
  title = '';
  content = '';

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
        this.loading.set(false);
        this.onChange();
        return;
      }

      this.chaptersService.getEditorChapter(this.slug, this.chapterSlug).subscribe({
        next: (chapter) => {
          this.chapter.set(chapter);
          this.title = chapter.title;
          this.content = chapter.content;
          this.loading.set(false);
          this.onChange();
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

  onChange() {
    this.previewHtml.set(this.markdownService.render(this.content));
    this.wordCount.set(this.markdownService.countWords(this.content));

    if (!this.chapterSlug) {
      return;
    }

    this.autosaveSub?.unsubscribe();
    this.autosaveSub = timer(1200).subscribe(() => this.runAutosave());
  }

  save() {
    if (this.isBusy() || !this.title.trim() || !this.content.trim()) {
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
}
