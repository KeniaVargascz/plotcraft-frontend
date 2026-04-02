import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChapterSummary } from '../../core/models/chapter.model';
import { NovelDetail } from '../../core/models/novel.model';
import { ChaptersService } from '../../core/services/chapters.service';
import { NovelsService } from '../../core/services/novels.service';

@Component({
  selector: 'app-novel-chapters-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (novel(); as currentNovel) {
      <section class="page-shell">
        <header class="page-header">
          <div>
            <h1>{{ currentNovel.title }}</h1>
            <p>Gestiona borradores, publicaciones y el orden editorial de tus capitulos.</p>
          </div>
          <div class="header-actions">
            <a [routerLink]="['/mis-novelas', currentNovel.slug, 'editar']">Editar novela</a>
            <a [routerLink]="['/mis-novelas', currentNovel.slug, 'capitulos', 'nuevo']"
              >Nuevo capitulo</a
            >
          </div>
        </header>

        <div class="chapter-list">
          @for (chapter of chapters(); track chapter.id) {
            <article class="chapter-row">
              <div>
                <strong>{{ chapter.order }}. {{ chapter.title }}</strong>
                <p>{{ chapter.status }} · {{ chapter.wordCount }} palabras</p>
              </div>

              <div class="row-actions">
                <a
                  [routerLink]="[
                    '/mis-novelas',
                    currentNovel.slug,
                    'capitulos',
                    chapter.slug,
                    'editar',
                  ]"
                >
                  Editar
                </a>
                @if (chapter.status !== 'PUBLISHED') {
                  <button type="button" (click)="publish(chapter)">Publicar</button>
                } @else {
                  <button type="button" (click)="unpublish(chapter)">Despublicar</button>
                }
                <button type="button" (click)="remove(chapter)">Eliminar</button>
              </div>
            </article>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .page-shell,
      .chapter-list {
        display: grid;
        gap: 1rem;
      }
      .page-header,
      .chapter-row,
      .header-actions,
      .row-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
      }
      .chapter-row {
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      a,
      button {
        padding: 0.65rem 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
      }
    `,
  ],
})
export class NovelChaptersPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly novelsService = inject(NovelsService);
  private readonly chaptersService = inject(ChaptersService);

  readonly novel = signal<NovelDetail | null>(null);
  readonly chapters = signal<ChapterSummary[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        return;
      }

      this.novelsService.getBySlug(slug).subscribe((novel) => this.novel.set(novel));
      this.loadChapters(slug);
    });
  }

  publish(chapter: ChapterSummary) {
    const slug = this.novel()?.slug;
    if (!slug) {
      return;
    }

    this.chaptersService.publish(slug, chapter.slug).subscribe(() => this.loadChapters(slug));
  }

  unpublish(chapter: ChapterSummary) {
    const slug = this.novel()?.slug;
    if (!slug) {
      return;
    }

    this.chaptersService.unpublish(slug, chapter.slug).subscribe(() => this.loadChapters(slug));
  }

  remove(chapter: ChapterSummary) {
    const slug = this.novel()?.slug;
    if (!slug) {
      return;
    }

    this.chaptersService.delete(slug, chapter.slug).subscribe(() => this.loadChapters(slug));
  }

  private loadChapters(slug: string) {
    this.chaptersService.listDrafts(slug, { limit: 100 }).subscribe((response) => {
      this.chapters.set(response.data);
    });
  }
}
