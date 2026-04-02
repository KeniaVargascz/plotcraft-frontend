import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChapterDetail } from '../../core/models/chapter.model';
import { ChaptersService } from '../../core/services/chapters.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-chapter-reader-page',
  standalone: true,
  imports: [RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-message />
    } @else if (chapter(); as currentChapter) {
      <article class="reader-shell">
        <nav class="breadcrumbs">
          <a routerLink="/novelas">Novelas</a>
          <span>/</span>
          <a [routerLink]="['/novelas', currentChapter.novel.slug]">{{
            currentChapter.novel.title
          }}</a>
          <span>/</span>
          <strong>{{ currentChapter.title }}</strong>
        </nav>

        <header>
          <h1>{{ currentChapter.title }}</h1>
          <p>
            por
            <a [routerLink]="['/perfil', currentChapter.novel.author.username]">
              @{{ currentChapter.novel.author.username }}
            </a>
          </p>
        </header>

        <section class="reader-body" [innerHTML]="html()"></section>

        <footer class="reader-nav">
          @if (currentChapter.navigation?.previous; as previous) {
            <a [routerLink]="['/novelas', currentChapter.novel.slug, previous.slug]">
              ← {{ previous.title }}
            </a>
          }

          @if (currentChapter.navigation?.next; as next) {
            <a [routerLink]="['/novelas', currentChapter.novel.slug, next.slug]">
              {{ next.title }} →
            </a>
          } @else {
            <a [routerLink]="['/perfil', currentChapter.novel.author.username]">
              Volver al perfil del autor
            </a>
          }
        </footer>
      </article>
    }
  `,
  styles: [
    `
      .reader-shell {
        max-width: 720px;
        margin: 0 auto;
        display: grid;
        gap: 1.5rem;
      }
      .breadcrumbs,
      .reader-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
      }
      .reader-body {
        padding: 2rem;
        border-radius: 1.5rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        line-height: 1.9;
      }
      a {
        color: var(--accent-text);
      }
    `,
  ],
})
export class ChapterReaderPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly chaptersService = inject(ChaptersService);
  private readonly markdownService = inject(MarkdownService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly chapter = signal<ChapterDetail | null>(null);
  readonly html = signal('');

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      const chapterSlug = params.get('chSlug');

      if (!slug || !chapterSlug) {
        return;
      }

      this.loading.set(true);
      this.chaptersService.getReaderChapter(slug, chapterSlug).subscribe({
        next: (chapter) => {
          this.chapter.set(chapter);
          this.html.set(this.markdownService.render(chapter.content));
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    });
  }
}
