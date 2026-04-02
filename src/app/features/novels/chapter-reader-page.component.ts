import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { throttleTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChapterDetail } from '../../core/models/chapter.model';
import { ReaderBookmark } from '../../core/models/bookmark.model';
import { Highlight, HighlightColor } from '../../core/models/highlight.model';
import { ReaderPreferences } from '../../core/models/reader.model';
import { AuthService } from '../../core/services/auth.service';
import { BookmarksService } from '../../core/services/bookmarks.service';
import { ChaptersService } from '../../core/services/chapters.service';
import { HighlightsService } from '../../core/services/highlights.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { ReaderService } from '../../core/services/reader.service';
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
        <header class="reader-topbar">
          <div class="reader-topbar__left">
            <a routerLink="/novelas">Novelas</a>
            <span>/</span>
            <a [routerLink]="['/novelas', currentChapter.novel.slug]">{{
              currentChapter.novel.title
            }}</a>
          </div>

          <div class="reader-topbar__actions">
            @if (!isAuthenticated()) {
              <span class="hint-banner">
                Inicia sesion para guardar tu progreso y subrayar fragmentos.
              </span>
            } @else {
              <button type="button" (click)="toggleBookmark()">Marcar posicion</button>
              <button type="button" (click)="showBookmarksPanel.update((value) => !value)">
                Marcadores
              </button>
            }
            <button type="button" (click)="showPreferences.update((value) => !value)">
              Preferencias
            </button>
          </div>
        </header>

        @if (preferences().show_progress) {
          <div class="progress-strip">
            <span [style.width.%]="progressPercent() * 100"></span>
          </div>
        }

        <header class="reader-header">
          <h1>{{ currentChapter.title }}</h1>
          <p>
            por
            <a [routerLink]="['/perfil', currentChapter.novel.author.username]">
              @{{ currentChapter.novel.author.username }}
            </a>
          </p>
        </header>

        <div class="reader-layout">
          @if (showPreferences()) {
            <aside class="panel">
              <h3>Preferencias de lectura</h3>
              <label>
                Fuente
                <select
                  [value]="preferences().font_family"
                  (change)="onPreferenceChange('font_family', $any($event.target).value)"
                >
                  <option value="crimson">Crimson Pro</option>
                  <option value="outfit">Outfit</option>
                  <option value="georgia">Georgia</option>
                  <option value="mono">Monoespaciada</option>
                </select>
              </label>
              <label>
                Tamano de letra
                <input
                  type="range"
                  min="14"
                  max="26"
                  [value]="preferences().font_size"
                  (input)="onPreferenceChange('font_size', +$any($event.target).value)"
                />
              </label>
              <label>
                Interlineado
                <input
                  type="range"
                  min="1.4"
                  max="2.4"
                  step="0.1"
                  [value]="preferences().line_height"
                  (input)="onPreferenceChange('line_height', +$any($event.target).value)"
                />
              </label>
              <label>
                Ancho
                <input
                  type="range"
                  min="560"
                  max="960"
                  step="10"
                  [value]="preferences().max_width"
                  (input)="onPreferenceChange('max_width', +$any($event.target).value)"
                />
              </label>
              <label>
                Modo
                <select
                  [value]="preferences().reading_mode"
                  (change)="onPreferenceChange('reading_mode', $any($event.target).value)"
                >
                  <option value="scroll">Scroll</option>
                  <option value="paginated">Paginado</option>
                </select>
              </label>
              <label class="toggle">
                <input
                  type="checkbox"
                  [checked]="preferences().show_progress"
                  (change)="onPreferenceChange('show_progress', $any($event.target).checked)"
                />
                Mostrar progreso
              </label>
            </aside>
          }

          <section class="reader-main">
            @if (showBookmarksPanel()) {
              <aside class="panel panel-inline">
                <h3>Marcadores</h3>
                @if (!bookmarks().length) {
                  <p>Sin marcadores en este capitulo</p>
                } @else {
                  @for (bookmark of bookmarks(); track bookmark.id) {
                    <div class="panel-row">
                      <a [routerLink]="[]" [fragment]="bookmark.anchor_id ?? undefined">{{
                        bookmark.label || bookmark.chapter.title
                      }}</a>
                      <button type="button" (click)="removeBookmark(bookmark.id)">Quitar</button>
                    </div>
                  }
                }
              </aside>
            }

            @if (preferences().reading_mode === 'paginated') {
              <section class="reader-paginated" #readerContainer>
                <div class="reader-body" [innerHTML]="pages()[currentPage()]"></div>
                <div class="reader-nav">
                  <button type="button" (click)="goToPreviousPage()">Anterior</button>
                  <span>Pagina {{ currentPage() + 1 }} de {{ pages().length }}</span>
                  <button type="button" (click)="goToNextPage()">Siguiente</button>
                </div>
              </section>
            } @else {
              <section
                class="reader-body"
                #readerContainer
                [innerHTML]="renderedHtml()"
                (mouseup)="handleSelection()"
                (contextmenu)="handleContextMenu($event)"
              ></section>
            }

            @if (selectionAnchorId() && isAuthenticated()) {
              <div class="selection-toolbar">
                @for (color of colors; track color) {
                  <button
                    type="button"
                    [style.background]="colorMap[color]"
                    (click)="createHighlight(color)"
                  >
                    {{ color }}
                  </button>
                }
              </div>
            }
          </section>
        </div>

        <footer class="reader-nav">
          @if (currentChapter.navigation?.previous; as previous) {
            <a [routerLink]="['/novelas', currentChapter.novel.slug, previous.slug]"
              >← {{ previous.title }}</a
            >
          }
          @if (currentChapter.navigation?.next; as next) {
            <a [routerLink]="['/novelas', currentChapter.novel.slug, next.slug]"
              >{{ next.title }} →</a
            >
          }
        </footer>
      </article>
    }
  `,
  styles: [
    `
      .reader-shell {
        display: grid;
        gap: 1rem;
      }
      .reader-topbar,
      .reader-topbar__left,
      .reader-topbar__actions,
      .reader-layout,
      .reader-nav,
      .panel-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .reader-topbar {
        position: sticky;
        top: 0;
        z-index: 5;
        background: color-mix(in srgb, var(--bg-app) 88%, transparent);
        padding: 0.75rem 0;
        backdrop-filter: blur(8px);
      }
      .progress-strip {
        height: 3px;
        background: var(--bg-surface);
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-strip span {
        display: block;
        height: 100%;
        background: var(--accent);
        transition: width 180ms ease;
      }
      .reader-layout {
        align-items: start;
      }
      .reader-main {
        flex: 1;
        display: grid;
        gap: 1rem;
      }
      .reader-body,
      .panel,
      .reader-paginated {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1.5rem;
      }
      .reader-body,
      .reader-paginated {
        padding: 2rem;
        margin: 0 auto;
        width: 100%;
        overflow-wrap: anywhere;
      }
      .panel {
        width: min(300px, 100%);
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
      }
      .panel-inline {
        width: 100%;
      }
      .reader-body {
        max-width: var(--reader-max-width, 720px);
        font-size: var(--reader-font-size, 18px);
        line-height: var(--reader-line-height, 1.8);
        font-family: var(--reader-font-family, 'Crimson Pro', Georgia, serif);
      }
      .reader-paginated .reader-body {
        padding: 0;
        border: 0;
        background: transparent;
      }
      .selection-toolbar {
        position: sticky;
        bottom: 1rem;
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 999px;
        background: var(--bg-surface);
        width: fit-content;
      }
      .hint-banner {
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      button,
      select,
      input {
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.5rem 0.8rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
      }
      .toggle {
        display: flex;
        align-items: center;
      }
      a {
        color: var(--accent-text);
      }
      @media (max-width: 960px) {
        .reader-layout {
          display: grid;
        }
      }
    `,
  ],
})
export class ChapterReaderPageComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly chaptersService = inject(ChaptersService);
  private readonly markdownService = inject(MarkdownService);
  private readonly authService = inject(AuthService);
  private readonly readerService = inject(ReaderService);
  private readonly bookmarksService = inject(BookmarksService);
  private readonly highlightsService = inject(HighlightsService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('readerContainer') readerContainer?: ElementRef<HTMLElement>;

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly chapter = signal<ChapterDetail | null>(null);
  readonly renderedHtml = signal('');
  readonly pages = signal<string[]>([]);
  readonly currentPage = signal(0);
  readonly showPreferences = signal(false);
  readonly showBookmarksPanel = signal(false);
  readonly bookmarks = signal<ReaderBookmark[]>([]);
  readonly highlights = signal<Highlight[]>([]);
  readonly selectionAnchorId = signal<string | null>(null);
  readonly selectionStart = signal(0);
  readonly selectionEnd = signal(0);
  readonly progressPercent = signal(0);
  readonly preferences = signal<ReaderPreferences>({
    id: 'local',
    font_family: 'crimson',
    font_size: 18,
    line_height: 1.8,
    max_width: 720,
    reading_mode: 'scroll',
    show_progress: true,
    created_at: '',
    updated_at: '',
  });

  readonly colors: HighlightColor[] = ['yellow', 'green', 'blue', 'pink'];
  readonly colorMap: Record<HighlightColor, string> = {
    yellow: '#f5d94a',
    green: '#76d39b',
    blue: '#76b4ff',
    pink: '#ff8ec7',
  };

  private readonly progressQueue = new Subject<number>();
  private readonly preferencesQueue = new Subject<Partial<ReaderPreferences>>();
  private slug = '';
  private chapterSlug = '';

  ngOnInit() {
    this.progressQueue
      .pipe(
        throttleTime(5000, undefined, { leading: false, trailing: true }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((scrollPct) => this.persistProgress(scrollPct));

    this.preferencesQueue
      .pipe(
        throttleTime(800, undefined, { leading: false, trailing: true }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((payload) => this.persistPreferences(payload));

    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      const chapterSlug = params.get('chSlug');

      if (!slug || !chapterSlug) {
        return;
      }

      this.slug = slug;
      this.chapterSlug = chapterSlug;
      this.loadChapter();
    });
  }

  ngAfterViewInit() {
    this.applyReaderStyles();
  }

  isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.preferences().reading_mode !== 'scroll' || !this.readerContainer) {
      return;
    }

    const container = this.readerContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const maxDistance = container.offsetHeight - window.innerHeight;
    const traveled = Math.min(Math.max(-rect.top, 0), Math.max(maxDistance, 1));
    const pct = maxDistance > 0 ? traveled / maxDistance : 1;

    this.progressPercent.set(pct);
    this.progressQueue.next(pct);
  }

  @HostListener('window:keydown.arrowright')
  onArrowRight() {
    if (this.preferences().reading_mode === 'paginated') {
      this.goToNextPage();
    }
  }

  @HostListener('window:keydown.arrowleft')
  onArrowLeft() {
    if (this.preferences().reading_mode === 'paginated') {
      this.goToPreviousPage();
    }
  }

  toggleBookmark() {
    const chapter = this.chapter();
    if (!chapter || !this.isAuthenticated()) {
      return;
    }

    this.bookmarksService
      .create({
        novel_id: chapter.novel.id,
        chapter_id: chapter.id,
        anchor_id: this.currentAnchorId(),
      })
      .subscribe(() => this.loadChapterBookmarks(chapter.id));
  }

  removeBookmark(id: string) {
    this.bookmarksService.remove(id).subscribe(() => {
      const chapter = this.chapter();
      if (chapter) {
        this.loadChapterBookmarks(chapter.id);
      }
    });
  }

  handleContextMenu(event: MouseEvent) {
    if (!this.isAuthenticated()) {
      return;
    }

    const paragraph = (event.target as HTMLElement | null)?.closest('[data-anchor-id]');
    if (!paragraph) {
      return;
    }

    event.preventDefault();
    const label = window.prompt('Etiqueta del marcador', '');
    const chapter = this.chapter();
    if (!chapter) {
      return;
    }

    this.bookmarksService
      .create({
        novel_id: chapter.novel.id,
        chapter_id: chapter.id,
        anchor_id: paragraph.getAttribute('data-anchor-id'),
        label,
      })
      .subscribe(() => this.loadChapterBookmarks(chapter.id));
  }

  handleSelection() {
    if (!this.isAuthenticated()) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      this.selectionAnchorId.set(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const paragraph = (
      range.startContainer.parentElement ?? (range.startContainer.parentNode as HTMLElement | null)
    )?.closest('[data-anchor-id]');

    if (!paragraph) {
      this.selectionAnchorId.set(null);
      return;
    }

    const fullText = paragraph.textContent ?? '';
    const selectedText = selection.toString();
    const startOffset = fullText.indexOf(selectedText);
    if (startOffset < 0) {
      this.selectionAnchorId.set(null);
      return;
    }

    this.selectionAnchorId.set(paragraph.getAttribute('data-anchor-id'));
    this.selectionStart.set(startOffset);
    this.selectionEnd.set(startOffset + selectedText.length);
  }

  createHighlight(color: HighlightColor) {
    const chapter = this.chapter();
    const anchorId = this.selectionAnchorId();
    if (!chapter || !anchorId) {
      return;
    }

    this.highlightsService
      .create({
        novel_id: chapter.novel.id,
        chapter_id: chapter.id,
        anchor_id: anchorId,
        start_offset: this.selectionStart(),
        end_offset: this.selectionEnd(),
        color,
      })
      .subscribe(() => {
        this.selectionAnchorId.set(null);
        this.loadChapterHighlights(chapter.id);
      });
  }

  goToNextPage() {
    const pages = this.pages();
    if (!pages.length) {
      return;
    }

    if (this.currentPage() < pages.length - 1) {
      this.currentPage.update((value) => value + 1);
      this.updatePaginatedProgress();
      return;
    }

    const next = this.chapter()?.navigation?.next;
    if (next) {
      window.location.href = `/novelas/${this.slug}/${next.slug}`;
    }
  }

  goToPreviousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update((value) => value - 1);
      this.updatePaginatedProgress();
      return;
    }

    const previous = this.chapter()?.navigation?.previous;
    if (previous) {
      window.location.href = `/novelas/${this.slug}/${previous.slug}`;
    }
  }

  onPreferenceChange(key: keyof ReaderPreferences, value: string | number | boolean) {
    const next = {
      ...this.preferences(),
      [key]: value,
    } as ReaderPreferences;

    this.preferences.set(next);
    this.applyReaderStyles();
    this.preferencesQueue.next({ [key]: value } as Partial<ReaderPreferences>);

    if (key === 'reading_mode') {
      this.buildPages();
    }
  }

  private loadChapter() {
    this.loading.set(true);
    this.selectionAnchorId.set(null);

    this.chaptersService.getReaderChapter(this.slug, this.chapterSlug).subscribe({
      next: (chapter) => {
        this.chapter.set(chapter);
        this.loadPreferences();
        this.refreshRenderedContent();
        this.buildPages();
        this.loading.set(false);
        if (this.isAuthenticated()) {
          this.readerService
            .addHistory({ novel_id: chapter.novel.id, chapter_id: chapter.id })
            .subscribe();
          this.loadChapterBookmarks(chapter.id);
          this.loadChapterHighlights(chapter.id);
          this.restoreProgress(chapter.novel.id);
        }
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadPreferences() {
    const localPreferences = localStorage.getItem('plotcraft_reader_preferences');
    if (localPreferences) {
      this.preferences.set(JSON.parse(localPreferences) as ReaderPreferences);
      this.applyReaderStyles();
    }

    if (!this.isAuthenticated()) {
      return;
    }

    this.readerService.getPreferences().subscribe((preferences) => {
      this.preferences.set(preferences);
      localStorage.setItem('plotcraft_reader_preferences', JSON.stringify(preferences));
      this.applyReaderStyles();
      this.buildPages();
    });
  }

  private persistPreferences(payload: Partial<ReaderPreferences>) {
    localStorage.setItem(
      'plotcraft_reader_preferences',
      JSON.stringify({ ...this.preferences(), ...payload }),
    );

    if (this.isAuthenticated()) {
      this.readerService.updatePreferences(payload).subscribe();
    }
  }

  private loadChapterBookmarks(chapterId: string) {
    this.bookmarksService
      .listByChapter(chapterId)
      .subscribe((bookmarks) => this.bookmarks.set(bookmarks));
  }

  private loadChapterHighlights(chapterId: string) {
    this.highlightsService.listByChapter(chapterId).subscribe((highlights) => {
      this.highlights.set(highlights);
      this.refreshRenderedContent();
      this.buildPages();
    });
  }

  private refreshRenderedContent() {
    const chapter = this.chapter();
    if (!chapter) {
      return;
    }

    const html = this.applyHighlightsToHtml(
      this.assignAnchorIds(this.markdownService.render(chapter.content)),
      this.highlights(),
    );

    this.renderedHtml.set(html);
  }

  private assignAnchorIds(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const targets = [...doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote')];

    targets.forEach((element, index) => {
      const anchor = `p-${index + 1}`;
      element.id = anchor;
      element.setAttribute('data-anchor-id', anchor);
    });

    return doc.body.innerHTML;
  }

  private applyHighlightsToHtml(html: string, highlights: Highlight[]) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const grouped = new Map<string, Highlight[]>();

    highlights.forEach((highlight) => {
      const list = grouped.get(highlight.anchor_id) ?? [];
      list.push(highlight);
      grouped.set(highlight.anchor_id, list);
    });

    grouped.forEach((items, anchorId) => {
      const element = doc.body.querySelector<HTMLElement>(`#${anchorId}`);
      if (!element) {
        return;
      }

      let text = element.textContent ?? '';
      items
        .sort((a, b) => b.start_offset - a.start_offset)
        .forEach((highlight) => {
          const before = text.slice(0, highlight.start_offset);
          const marked = text.slice(highlight.start_offset, highlight.end_offset);
          const after = text.slice(highlight.end_offset);
          text =
            `${this.escapeHtml(before)}<span class="reader-highlight reader-highlight--${highlight.color}" data-highlight-id="${highlight.id}">` +
            `${this.escapeHtml(marked)}</span>${this.escapeHtml(after)}`;
        });

      element.innerHTML = text;
    });

    return doc.body.innerHTML;
  }

  private buildPages() {
    if (this.preferences().reading_mode !== 'paginated') {
      this.pages.set([]);
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.renderedHtml(), 'text/html');
    const nodes = [...doc.body.children].map((node) => node.outerHTML);
    const pageSize = Math.max(2, Math.floor((window.innerHeight - 240) / 120));
    const pages: string[] = [];

    for (let index = 0; index < nodes.length; index += pageSize) {
      pages.push(nodes.slice(index, index + pageSize).join(''));
    }

    this.pages.set(pages.length ? pages : ['']);
  }

  private restoreProgress(novelId: string) {
    this.readerService.getProgress(novelId).subscribe((progress) => {
      if (!progress) {
        return;
      }

      this.progressPercent.set(progress.scroll_pct);
      if (this.preferences().reading_mode === 'paginated') {
        this.currentPage.set(
          Math.max(
            0,
            Math.min(
              this.pages().length - 1,
              Math.round(progress.scroll_pct * Math.max(this.pages().length - 1, 1)),
            ),
          ),
        );
        return;
      }

      requestAnimationFrame(() => {
        const container = this.readerContainer?.nativeElement;
        if (!container) {
          return;
        }

        const anchor = this.currentAnchorId();
        if (anchor) {
          document.getElementById(anchor)?.scrollIntoView({ block: 'center' });
          return;
        }

        window.scrollTo({
          top: container.offsetTop + container.offsetHeight * progress.scroll_pct,
        });
      });
    });
  }

  private persistProgress(scrollPct: number) {
    const chapter = this.chapter();
    if (!chapter || !this.isAuthenticated()) {
      return;
    }

    this.readerService
      .saveProgress({
        novel_id: chapter.novel.id,
        chapter_id: chapter.id,
        scroll_pct: scrollPct,
      })
      .subscribe();
  }

  private updatePaginatedProgress() {
    const pct = this.pages().length > 1 ? this.currentPage() / (this.pages().length - 1) : 1;
    this.progressPercent.set(pct);
    this.progressQueue.next(pct);
  }

  private currentAnchorId() {
    const anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-anchor-id]'));
    if (!anchors.length) {
      return null;
    }

    const candidate =
      anchors.find((anchor) => anchor.getBoundingClientRect().top >= 0) ?? anchors[0];
    return candidate.getAttribute('data-anchor-id');
  }

  private applyReaderStyles() {
    const container = this.readerContainer?.nativeElement;
    if (!container) {
      return;
    }

    const fontMap: Record<string, string> = {
      crimson: "'Crimson Pro', Georgia, serif",
      outfit: "'Outfit', sans-serif",
      georgia: 'Georgia, serif',
      mono: "'Courier New', monospace",
    };

    container.style.setProperty('--reader-font-size', `${this.preferences().font_size}px`);
    container.style.setProperty('--reader-line-height', `${this.preferences().line_height}`);
    container.style.setProperty('--reader-max-width', `${this.preferences().max_width}px`);
    container.style.setProperty(
      '--reader-font-family',
      fontMap[this.preferences().font_family] ?? fontMap['crimson'],
    );
  }

  private escapeHtml(value: string) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }
}
