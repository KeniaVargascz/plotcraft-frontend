import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NovelDetail } from '../../core/models/novel.model';
import { AuthService } from '../../core/services/auth.service';
import { NovelsService } from '../../core/services/novels.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-novel-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, ErrorMessageComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-message />
    } @else if (novel(); as currentNovel) {
      <section class="detail-shell">
        <article class="hero">
          <div class="cover">{{ currentNovel.title.charAt(0) }}</div>

          <div class="meta">
            <div class="chips">
              <span>{{ currentNovel.status }}</span>
              <span>{{ currentNovel.rating }}</span>
              <span>{{ currentNovel.wordCount }} palabras</span>
            </div>
            <h1>{{ currentNovel.title }}</h1>
            <p class="author">
              por
              <a [routerLink]="['/perfil', currentNovel.author.username]"
                >@{{ currentNovel.author.username }}</a
              >
            </p>
            <p class="synopsis">{{ currentNovel.synopsis }}</p>

            <div class="actions">
              @if (currentNovel.viewerContext && !currentNovel.viewerContext.isAuthor) {
                <button type="button" (click)="toggleLike()">
                  {{ currentNovel.viewerContext.hasLiked ? 'Quitar like' : 'Dar like' }}
                </button>
                <button type="button" (click)="toggleBookmark()">
                  {{ currentNovel.viewerContext.hasBookmarked ? 'Quitar guardado' : 'Guardar' }}
                </button>
              }

              @if (currentNovel.viewerContext?.isAuthor) {
                <a [routerLink]="['/mis-novelas', currentNovel.slug, 'editar']">Editar novela</a>
                <a [routerLink]="['/mis-novelas', currentNovel.slug, 'capitulos']"
                  >Gestionar capitulos</a
                >
              }
            </div>
          </div>
        </article>

        <section class="content-grid">
          <div class="chapter-list card">
            <h2>Capitulos</h2>
            @for (chapter of currentNovel.chapters; track chapter.id) {
              <a class="chapter-item" [routerLink]="['/novelas', currentNovel.slug, chapter.slug]">
                <span>{{ chapter.order }}. {{ chapter.title }}</span>
                <small>{{ chapter.wordCount }} palabras</small>
              </a>
            }
          </div>

          <aside class="stats card">
            <h3>Estadisticas</h3>
            <span>{{ currentNovel.stats.chaptersCount }} capitulos</span>
            <span>{{ currentNovel.stats.likesCount }} likes</span>
            <span>{{ currentNovel.stats.bookmarksCount }} guardados</span>
            <span>{{ currentNovel.viewsCount }} vistas</span>
            <span>Actualizada {{ currentNovel.updatedAt | date: 'longDate' }}</span>
          </aside>
        </section>
      </section>
    }
  `,
  styles: [
    `
      .detail-shell,
      .meta,
      .card,
      .chapter-list {
        display: grid;
        gap: 1rem;
      }
      .hero,
      .content-grid {
        display: grid;
        gap: 1.25rem;
      }
      .hero {
        grid-template-columns: 220px 1fr;
      }
      .cover,
      .card {
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .cover {
        min-height: 320px;
        display: grid;
        place-items: center;
        font-size: 4rem;
      }
      .meta,
      .card {
        padding: 1.25rem;
      }
      .chips,
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .chips span,
      .actions a,
      .actions button,
      .stats span {
        padding: 0.5rem 0.75rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        border: 0;
      }
      .content-grid {
        grid-template-columns: 1fr 280px;
        margin-top: 1.5rem;
      }
      .chapter-item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        text-decoration: none;
        color: var(--text-1);
        padding: 0.85rem 0;
        border-bottom: 1px solid var(--border);
      }
      @media (max-width: 900px) {
        .hero,
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class NovelDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly novelsService = inject(NovelsService);
  readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly novel = signal<NovelDetail | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        return;
      }

      this.loading.set(true);
      this.novelsService.getBySlug(slug).subscribe({
        next: (novel) => {
          this.novel.set(novel);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    });
  }

  toggleLike() {
    const novel = this.novel();
    if (!novel) {
      return;
    }

    this.novelsService.toggleLike(novel.slug).subscribe((response) => {
      this.novel.set({
        ...novel,
        stats: {
          ...novel.stats,
          likesCount: novel.stats.likesCount + (response.hasLiked ? 1 : -1),
        },
        viewerContext: novel.viewerContext
          ? { ...novel.viewerContext, hasLiked: response.hasLiked }
          : null,
      });
    });
  }

  toggleBookmark() {
    const novel = this.novel();
    if (!novel) {
      return;
    }

    this.novelsService.toggleBookmark(novel.slug).subscribe((response) => {
      this.novel.set({
        ...novel,
        stats: {
          ...novel.stats,
          bookmarksCount: novel.stats.bookmarksCount + (response.hasBookmarked ? 1 : -1),
        },
        viewerContext: novel.viewerContext
          ? { ...novel.viewerContext, hasBookmarked: response.hasBookmarked }
          : null,
      });
    });
  }
}
