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
        <a [routerLink]="['/mis-novelas', slug, 'capitulos']">← Volver a capitulos</a>
        <div class="meta">
          <span>{{ wordCount() }} palabras</span>
          @if (savedAt()) {
            <span>Guardado {{ savedAt() }}</span>
          }
        </div>
        <div class="actions">
          <button type="button" (click)="save()">{{ isCreate() ? 'Crear' : 'Guardar' }}</button>
          @if (!isCreate() && chapter()) {
            <button type="button" (click)="publish()">Publicar</button>
          }
        </div>
      </header>

      <div class="editor-grid">
        <section class="editor-pane">
          <input
            [(ngModel)]="title"
            placeholder="Titulo del capitulo"
            (ngModelChange)="onChange()"
          />
          <textarea
            [(ngModel)]="content"
            rows="24"
            placeholder="Escribe tu capitulo en Markdown"
            (ngModelChange)="onChange()"
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

  slug = '';
  chapterSlug: string | null = null;
  title = '';
  content = '';
  private autosaveSub?: Subscription;

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.slug = params.get('slug') ?? '';
      this.chapterSlug = params.get('chSlug');
      this.isCreate.set(!this.chapterSlug);

      if (!this.chapterSlug) {
        this.onChange();
        return;
      }

      this.chaptersService.getEditorChapter(this.slug, this.chapterSlug).subscribe((chapter) => {
        this.chapter.set(chapter);
        this.title = chapter.title;
        this.content = chapter.content;
        this.onChange();
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
    this.autosaveSub = timer(1200).subscribe(() => {
      this.chaptersService
        .autosave(this.slug, this.chapterSlug!, {
          title: this.title,
          content: this.content,
        })
        .subscribe((result) => {
          this.savedAt.set(new Date(result.savedAt).toLocaleTimeString());
          this.wordCount.set(result.wordCount);
        });
    });
  }

  save() {
    if (this.isCreate()) {
      this.chaptersService
        .create(this.slug, {
          title: this.title,
          content: this.content,
        })
        .subscribe((chapter) => {
          this.router.navigate(['/mis-novelas', this.slug, 'capitulos', chapter.slug, 'editar']);
        });
      return;
    }

    this.chaptersService
      .update(this.slug, this.chapterSlug!, {
        title: this.title,
        content: this.content,
      })
      .subscribe((chapter) => {
        this.chapter.set(chapter);
        this.savedAt.set(new Date().toLocaleTimeString());
      });
  }

  publish() {
    if (!this.chapterSlug) {
      return;
    }

    this.chaptersService.publish(this.slug, this.chapterSlug).subscribe((chapter) => {
      this.chapter.set(chapter);
      this.savedAt.set(new Date().toLocaleTimeString());
    });
  }
}
