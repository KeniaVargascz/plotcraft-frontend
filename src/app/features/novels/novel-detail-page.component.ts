import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NovelDetail } from '../../core/models/novel.model';
import { AuthService } from '../../core/services/auth.service';
import { NovelsService } from '../../core/services/novels.service';
import { ReadingList } from '../../core/models/reading-list.model';
import { ReadingListsService } from '../../core/services/reading-lists.service';
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
              @if (
                currentNovel.viewerContext?.reading_progress &&
                currentNovel.viewerContext?.reading_progress?.chapter_slug
              ) {
                <a
                  [routerLink]="[
                    '/novelas',
                    currentNovel.slug,
                    currentNovel.viewerContext?.reading_progress?.chapter_slug,
                  ]"
                >
                  Continuar desde cap.
                  {{ currentNovel.viewerContext?.reading_progress?.chapter_order }} -
                  {{ currentNovel.viewerContext?.reading_progress?.chapter_title }}
                </a>
              } @else if (authService.isAuthenticated() && currentNovel.chapters.length) {
                <a [routerLink]="['/novelas', currentNovel.slug, currentNovel.chapters[0].slug]">
                  Comenzar a leer
                </a>
              }

              @if (currentNovel.viewerContext && !currentNovel.viewerContext.isAuthor) {
                <button type="button" (click)="toggleLike()">
                  {{ currentNovel.viewerContext.hasLiked ? 'Quitar like' : 'Dar like' }}
                </button>
                <button type="button" (click)="toggleBookmark()">
                  {{ currentNovel.viewerContext.hasBookmarked ? 'Quitar guardado' : 'Guardar' }}
                </button>
                @if (authService.isAuthenticated()) {
                  <button type="button" [disabled]="listsLoading()" (click)="toggleListsMenu()">
                    {{ listsLoading() ? 'Cargando listas...' : 'Guardar en lista' }}
                  </button>
                }
              }

              @if (currentNovel.viewerContext?.isAuthor) {
                <a [routerLink]="['/mis-novelas', currentNovel.slug, 'editar']">Editar novela</a>
                <a [routerLink]="['/mis-novelas', currentNovel.slug, 'capitulos']"
                  >Gestionar capitulos</a
                >
              }
            </div>

            @if (showListsMenu()) {
              <div class="list-menu">
                @if (listsLoading()) {
                  <span class="list-feedback list-feedback-muted">Cargando tus listas...</span>
                } @else if (listsError()) {
                  <span class="list-feedback list-feedback-error">{{ listsError() }}</span>
                } @else if (!readingLists().length) {
                  <span class="list-feedback list-feedback-muted">
                    Aun no tienes listas creadas para guardar esta novela.
                  </span>
                } @else {
                  @for (list of readingLists(); track list.id) {
                    <label
                      class="list-option"
                      [class.list-option-busy]="listActionId() === list.id"
                    >
                      <input
                        type="checkbox"
                        [checked]="listMembership().has(list.id)"
                        [disabled]="listActionId() === list.id || listsLoading()"
                        (change)="toggleListMembership(list)"
                      />
                      <span class="list-option-copy">
                        <strong>{{ list.name }}</strong>
                        <small>
                          @if (listActionId() === list.id) {
                            Procesando...
                          } @else if (listMembership().has(list.id)) {
                            Guardada en esta lista
                          } @else {
                            Disponible
                          }
                        </small>
                      </span>
                    </label>
                  }

                  @if (listsMessage()) {
                    <span class="list-feedback list-feedback-success">{{ listsMessage() }}</span>
                  }
                }
              </div>
            }
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
      .list-menu {
        display: grid;
        gap: 0.5rem;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .list-option {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        cursor: pointer;
      }
      .list-option-busy {
        opacity: 0.7;
      }
      .list-option-copy {
        display: grid;
        gap: 0.25rem;
      }
      .list-option-copy small,
      .list-feedback {
        color: var(--text-2);
      }
      .list-feedback-error {
        color: #b42318;
      }
      .list-feedback-success {
        color: #027a48;
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
  private readonly readingListsService = inject(ReadingListsService);
  readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly novel = signal<NovelDetail | null>(null);
  readonly readingLists = signal<ReadingList[]>([]);
  readonly showListsMenu = signal(false);
  readonly listMembership = signal(new Set<string>());
  readonly listsLoading = signal(false);
  readonly listsError = signal<string | null>(null);
  readonly listsMessage = signal<string | null>(null);
  readonly listActionId = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        return;
      }

      this.error.set(false);
      this.showListsMenu.set(false);
      this.listsError.set(null);
      this.listsMessage.set(null);
      this.listActionId.set(null);
      this.readingLists.set([]);
      this.listMembership.set(new Set<string>());
      this.loading.set(true);
      this.novelsService.getBySlug(slug).subscribe({
        next: (novel) => {
          this.novel.set(novel);
          if (this.authService.isAuthenticated()) {
            this.loadReadingLists(novel.id);
          }
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

  toggleListsMenu() {
    if (this.listsLoading()) {
      return;
    }

    this.showListsMenu.update((value) => !value);
  }

  toggleListMembership(list: ReadingList) {
    const novel = this.novel();
    if (!novel || this.listActionId()) {
      return;
    }

    const alreadyIncluded = this.listMembership().has(list.id);
    this.listActionId.set(list.id);
    this.listsError.set(null);
    this.listsMessage.set(null);

    if (alreadyIncluded) {
      this.readingListsService
        .removeItem(list.id, novel.id)
        .pipe(finalize(() => this.listActionId.set(null)))
        .subscribe({
          next: () => {
            this.listsMessage.set(`"${list.name}" actualizada.`);
            this.loadReadingLists(novel.id, false);
          },
          error: () => {
            this.listsError.set('No se pudo quitar la novela de la lista.');
          },
        });
      return;
    }

    this.readingListsService
      .addItem(list.id, { novel_id: novel.id })
      .pipe(finalize(() => this.listActionId.set(null)))
      .subscribe({
        next: () => {
          this.listsMessage.set(`"${list.name}" actualizada.`);
          this.loadReadingLists(novel.id, false);
        },
        error: () => {
          this.listsError.set('No se pudo guardar la novela en la lista.');
        },
      });
  }

  private loadReadingLists(novelId: string, showLoader = true) {
    if (showLoader) {
      this.listsLoading.set(true);
    }

    this.listsError.set(null);
    this.readingListsService
      .listMine(novelId)
      .pipe(finalize(() => this.listsLoading.set(false)))
      .subscribe({
        next: (lists) => {
          this.readingLists.set(lists);
          this.listMembership.set(
            new Set(lists.filter((list) => list.contains_novel).map((list) => list.id)),
          );
        },
        error: () => {
          this.readingLists.set([]);
          this.listMembership.set(new Set<string>());
          this.listsError.set('No se pudieron cargar tus listas.');
        },
      });
  }
}
