import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LibraryNovelCard } from '../../core/models/library.model';
import { LibraryService } from '../../core/services/library.service';

@Component({
  selector: 'app-in-progress-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="progress-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Biblioteca</p>
          <h1>Leyendo ahora</h1>
          <p class="lede">
            Tus lecturas activas con acceso directo al punto exacto de continuacion.
          </p>
        </div>
        <div class="hero-stat">
          <strong>{{ items().length }}</strong>
          <span>novelas activas</span>
        </div>
      </header>

      @if (!items().length) {
        <section class="empty-state card">
          <h2>Aun no estas leyendo ninguna novela</h2>
          <p>Cuando avances en el lector, tus historias activas apareceran aqui automaticamente.</p>
        </section>
      } @else {
        <section class="grid">
          @for (item of items(); track item.id) {
            <article class="reading-card card">
              <div class="row">
                <div class="cover">{{ item.title.charAt(0) }}</div>
                <div class="copy">
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.author.displayName }}</span>
                  <small
                    >{{ item.stats.chaptersCount }} capitulos ·
                    {{ item.stats.bookmarksCount }} guardados</small
                  >
                </div>
              </div>

              @if (item.readingProgress; as progress) {
                <a class="cta" [routerLink]="['/novelas', item.slug, progress.chapterSlug]">
                  Continuar desde cap. {{ progress.chapterOrder }} - {{ progress.chapterTitle }}
                </a>
              }
            </article>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .progress-shell,
      .grid {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.25rem;
        border: 1px solid var(--border);
        border-radius: 1.25rem;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--bg-card) 92%, white 8%),
          var(--bg-card)
        );
        box-shadow: 0 12px 30px color-mix(in srgb, var(--bg) 82%, transparent);
      }
      .hero,
      .row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .eyebrow,
      .lede,
      .copy span,
      .copy small {
        color: var(--text-2);
      }
      .hero-stat {
        display: grid;
        gap: 0.35rem;
        min-width: 180px;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .hero-stat strong {
        font-size: 2rem;
        line-height: 1;
      }
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .reading-card,
      .copy {
        display: grid;
        gap: 1rem;
      }
      .cover {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 1rem;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 1.4rem;
        font-weight: 700;
      }
      .cta {
        border-radius: 0.95rem;
        border: 1px solid var(--border);
        padding: 0.85rem 1rem;
        text-decoration: none;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class InProgressPageComponent {
  private readonly libraryService = inject(LibraryService);
  private readonly destroyRef = inject(DestroyRef);
  readonly items = signal<LibraryNovelCard[]>([]);

  constructor() {
    this.libraryService.listInProgress().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((response) => this.items.set(response.data));
  }
}
