import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChapterSummary } from '../../core/models/chapter.model';
import { NovelDetail } from '../../core/models/novel.model';
import { ChaptersService } from '../../core/services/chapters.service';
import { NovelsService } from '../../core/services/novels.service';
import { TimelineService } from '../../core/services/timeline.service';
import { PlannerService } from '../../core/services/planner.service';

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
            <button type="button" class="quick-btn" (click)="goToTimeline(currentNovel.slug)">
              Timeline
            </button>
            <button type="button" class="quick-btn" (click)="goToPlanner(currentNovel.slug)">
              Planner
            </button>
            <a [routerLink]="['/mis-novelas', currentNovel.slug, 'editar']">Editar novela</a>
            <a [routerLink]="['/mis-novelas', currentNovel.slug, 'capitulos', 'nuevo']">
              Nuevo capitulo
            </a>
          </div>
        </header>

        <div class="chapter-list">
          @if (loading()) {
            <p class="status">Cargando capitulos...</p>
          } @else if (!chapters().length) {
            <p class="status">No hay datos para mostrar.</p>
          }
          @if (actionMessage()) {
            <p class="status">{{ actionMessage() }}</p>
          }

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
                  <button
                    type="button"
                    (click)="publish(chapter)"
                    [disabled]="actionLoadingId() === chapter.id"
                  >
                    {{ actionLoadingId() === chapter.id ? 'Procesando...' : 'Publicar' }}
                  </button>
                } @else {
                  <button
                    type="button"
                    (click)="unpublish(chapter)"
                    [disabled]="actionLoadingId() === chapter.id"
                  >
                    {{ actionLoadingId() === chapter.id ? 'Procesando...' : 'Despublicar' }}
                  </button>
                }

                <button
                  type="button"
                  (click)="remove(chapter)"
                  [disabled]="actionLoadingId() === chapter.id"
                >
                  {{ actionLoadingId() === chapter.id ? 'Procesando...' : 'Eliminar' }}
                </button>
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

      .status {
        margin: 0;
        padding: 0.85rem 1rem;
        border-radius: 1rem;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
    `,
  ],
})
export class NovelChaptersPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly novelsService = inject(NovelsService);
  private readonly chaptersService = inject(ChaptersService);
  private readonly timelineService = inject(TimelineService);
  private readonly plannerService = inject(PlannerService);

  readonly novel = signal<NovelDetail | null>(null);
  readonly chapters = signal<ChapterSummary[]>([]);
  readonly loading = signal(true);
  readonly actionLoadingId = signal<string | null>(null);
  readonly actionMessage = signal('');

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
    if (!slug || this.actionLoadingId()) {
      return;
    }

    this.actionLoadingId.set(chapter.id);
    this.actionMessage.set(`Publicando "${chapter.title}"...`);

    this.chaptersService.publish(slug, chapter.slug).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.actionMessage.set(`"${chapter.title}" publicado.`);
        this.loadChapters(slug);
      },
      error: () => {
        this.actionLoadingId.set(null);
        this.actionMessage.set(`No se pudo publicar "${chapter.title}".`);
      },
    });
  }

  unpublish(chapter: ChapterSummary) {
    const slug = this.novel()?.slug;
    if (!slug || this.actionLoadingId()) {
      return;
    }

    this.actionLoadingId.set(chapter.id);
    this.actionMessage.set(`Despublicando "${chapter.title}"...`);

    this.chaptersService.unpublish(slug, chapter.slug).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.actionMessage.set(`"${chapter.title}" se movio a borrador.`);
        this.loadChapters(slug);
      },
      error: () => {
        this.actionLoadingId.set(null);
        this.actionMessage.set(`No se pudo despublicar "${chapter.title}".`);
      },
    });
  }

  remove(chapter: ChapterSummary) {
    const slug = this.novel()?.slug;
    if (!slug || this.actionLoadingId()) {
      return;
    }

    this.actionLoadingId.set(chapter.id);
    this.actionMessage.set(`Eliminando "${chapter.title}"...`);

    this.chaptersService.delete(slug, chapter.slug).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.actionMessage.set(`"${chapter.title}" eliminado.`);
        this.loadChapters(slug);
      },
      error: () => {
        this.actionLoadingId.set(null);
        this.actionMessage.set(`No se pudo eliminar "${chapter.title}".`);
      },
    });
  }

  goToTimeline(slug: string) {
    this.timelineService.getByNovelSlug(slug).subscribe({
      next: (timeline) => void this.router.navigate(['/mis-timelines', timeline.id]),
    });
  }

  goToPlanner(slug: string) {
    this.plannerService.getByNovelSlug(slug).subscribe({
      next: (project) => void this.router.navigate(['/planner', project.id]),
    });
  }

  private loadChapters(slug: string) {
    this.loading.set(true);
    this.actionMessage.set('');

    this.chaptersService.listDrafts(slug, { limit: 50 }).subscribe({
      next: (response) => {
        this.chapters.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.actionMessage.set('No se pudieron cargar los capitulos.');
      },
    });
  }
}
