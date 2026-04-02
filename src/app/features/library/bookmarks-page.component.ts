import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NovelBookmarksGroup } from '../../core/models/bookmark.model';
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
                  <span>{{ item.author.display_name }}</span>
                </div>
                <a [routerLink]="['/novelas', item.slug]">Ver detalle</a>
              </div>
              @if (item.reading_progress; as progress) {
                <a [routerLink]="['/novelas', item.slug, progress.chapter_slug]">
                  Continuar desde cap. {{ progress.chapter_order }} -
                  {{ progress.chapter_title }}
                </a>
              } @else if (item.last_chapter; as lastChapter) {
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
          <small>{{ groups().length }} novelas</small>
        </div>

        @if (!groups().length) {
          <p>Aun no tienes marcadores de lectura guardados.</p>
        } @else {
          @for (group of groups(); track group.novel.id) {
            <article class="card">
              <h3>{{ group.novel.title }}</h3>
              @for (bookmark of group.bookmarks; track bookmark.id) {
                <div class="row">
                  <a
                    [routerLink]="['/novelas', bookmark.novel.slug, bookmark.chapter.slug]"
                    [fragment]="bookmark.anchor_id ?? undefined"
                  >
                    {{ bookmark.chapter.title }} {{ bookmark.label ? '- ' + bookmark.label : '' }}
                  </a>
                  <button type="button" (click)="remove(bookmark.id)">Eliminar</button>
                </div>
              }
            </article>
          }
        }
      </section>
    </section>
  `,
  styles: [
    '.page-shell,.section,.card,.stack{display:grid;gap:1rem}.card{padding:1rem;border:1px solid var(--border);border-radius:1rem;background:var(--bg-card)}.row,.section-head{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.lede{color:var(--text-2)}.stack span,.section-head small{color:var(--text-2)}',
  ],
})
export class BookmarksPageComponent {
  private readonly libraryService = inject(LibraryService);
  private readonly bookmarksService = inject(BookmarksService);
  readonly bookmarkedNovels = signal<LibraryNovelCard[]>([]);
  readonly groups = signal<NovelBookmarksGroup[]>([]);

  constructor() {
    this.load();
  }

  remove(id: string) {
    this.bookmarksService.remove(id).subscribe(() => this.load());
  }

  private load() {
    forkJoin({
      bookmarked: this.libraryService.listBookmarked(),
      groups: this.bookmarksService.listAll(),
    }).subscribe(({ bookmarked, groups }) => {
      this.bookmarkedNovels.set(bookmarked.data);
      this.groups.set(groups);
    });
  }
}
