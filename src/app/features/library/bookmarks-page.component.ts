import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ReaderBookmark } from '../../core/models/bookmark.model';
import { BookmarksService } from '../../core/services/bookmarks.service';
import { LibraryNovelCard } from '../../core/models/library.model';
import { LibraryService } from '../../core/services/library.service';

@Component({
  selector: 'app-bookmarks-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page-shell">
      <h1>Marcadores</h1>
      <p class="lede">Aqui encuentras tus novelas guardadas y tus marcadores de lectura.</p>

      <section class="section">
        <div class="section-head">
          <h2>Novelas guardadas</h2>
          <small>{{ bookmarkedNovels().length }} novelas</small>
        </div>

        @if (!bookmarkedNovels().length) {
          <p>Aun no tienes novelas guardadas.</p>
        } @else {
          @for (item of bookmarkedNovels(); track item.id) {
            <article class="card">
              <div class="row">
                <div class="stack">
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.author.displayName }}</span>
                </div>
                <a [routerLink]="['/novelas', item.slug]">Ver detalle</a>
              </div>
              @if (item.readingProgress; as progress) {
                <a [routerLink]="['/novelas', item.slug, progress.chapterSlug]">
                  Continuar desde cap. {{ progress.chapterOrder }} -
                  {{ progress.chapterTitle }}
                </a>
              } @else if (item.lastChapter; as lastChapter) {
                <a [routerLink]="['/novelas', item.slug, lastChapter.slug]">
                  Ir al ultimo capitulo publicado
                </a>
              }
            </article>
          }
        }
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Marcadores de lectura</h2>
          <small>{{ bookmarks().length }} marcadores</small>
        </div>

        @if (!bookmarks().length && !loadingBookmarks()) {
          <p>Aun no tienes marcadores de lectura guardados.</p>
        } @else {
          @for (bookmark of bookmarks(); track bookmark.id) {
            <article class="card">
              <div class="row">
                <div class="stack">
                  <strong>{{ bookmark.novel.title }}</strong>
                  <span>{{ bookmark.chapter.title }}</span>
                </div>
                <div class="row">
                  <a
                    [routerLink]="['/novelas', bookmark.novel.slug, bookmark.chapter.slug]"
                    [fragment]="bookmark.anchorId ?? undefined"
                  >
                    {{ bookmark.label || 'Ir al marcador' }}
                  </a>
                  <button type="button" (click)="remove(bookmark.id)">Eliminar</button>
                </div>
              </div>
            </article>
          }
        }

        @if (hasMoreBookmarks()) {
          <button
            type="button"
            class="load-more"
            [disabled]="loadingBookmarks()"
            (click)="loadMoreBookmarks()"
          >
            {{ loadingBookmarks() ? 'Cargando...' : 'Cargar mas' }}
          </button>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .page-shell,
      .section,
      .card,
      .stack {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1rem;
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: var(--bg-card);
      }
      .row,
      .section-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .lede {
        color: var(--text-2);
      }
      .stack span,
      .section-head small {
        color: var(--text-2);
      }
      .load-more {
        justify-self: center;
        padding: 0.75rem 2rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
        transition: background 0.2s;
      }
      .load-more:hover:not(:disabled) {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .load-more:disabled {
        opacity: 0.6;
        cursor: default;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookmarksPageComponent {
  private readonly libraryService = inject(LibraryService);
  private readonly bookmarksService = inject(BookmarksService);
  private readonly destroyRef = inject(DestroyRef);
  readonly bookmarkedNovels = signal<LibraryNovelCard[]>([]);
  readonly bookmarks = signal<ReaderBookmark[]>([]);
  readonly loadingBookmarks = signal(false);
  readonly hasMoreBookmarks = signal(false);
  private bookmarksCursor: string | null = null;

  constructor() {
    this.load();
  }

  remove(id: string) {
    this.bookmarksService.remove(id).subscribe(() => {
      this.bookmarks.update((list) => list.filter((b) => b.id !== id));
    });
  }

  loadMoreBookmarks() {
    this.fetchBookmarks(false);
  }

  private load() {
    this.libraryService.listBookmarked().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
      this.bookmarkedNovels.set(res.data);
    });
    this.fetchBookmarks(true);
  }

  private fetchBookmarks(reset: boolean) {
    this.loadingBookmarks.set(true);
    this.bookmarksService.listAll(reset ? null : this.bookmarksCursor, 20).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.bookmarks.update((list) => (reset ? res.data : [...list, ...res.data]));
        this.bookmarksCursor = res.pagination.nextCursor;
        this.hasMoreBookmarks.set(res.pagination.hasMore);
        this.loadingBookmarks.set(false);
      },
      error: () => this.loadingBookmarks.set(false),
    });
  }
}
