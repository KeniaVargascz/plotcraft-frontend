import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ReadingHistoryItem } from '../../core/models/reader.model';
import { LibraryService } from '../../core/services/library.service';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <section class="history-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Biblioteca</p>
          <h1>Historial</h1>
          <p class="lede">
            Recupera tus ultimas sesiones y vuelve justo al capitulo donde te quedaste.
          </p>
        </div>
        <div class="hero-stat">
          <strong>{{ items().length }}</strong>
          <span>entradas recientes</span>
        </div>
      </header>

      @if (!items().length) {
        <section class="empty-state card">
          <h2>Tu historial aun esta vacio</h2>
          <p>Cuando abras capitulos desde el lector, apareceran aqui en orden cronologico.</p>
        </section>
      } @else {
        <section class="timeline">
          @for (item of items(); track item.chapter.id + item.opened_at) {
            <a class="entry card" [routerLink]="['/novelas', item.novel.slug, item.chapter.slug]">
              <div class="entry-top">
                <div class="cover">{{ item.novel.title.charAt(0) }}</div>
                <div class="copy">
                  <strong>{{ item.novel.title }}</strong>
                  <span>{{ item.chapter.order }}. {{ item.chapter.title }}</span>
                </div>
                <small>{{ item.opened_at | date: 'short' }}</small>
              </div>
            </a>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .history-shell,
      .timeline {
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
      .entry-top {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .eyebrow,
      .lede,
      .copy span,
      .entry-top small {
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
      .entry {
        text-decoration: none;
        color: inherit;
      }
      .cover {
        display: grid;
        place-items: center;
        width: 56px;
        height: 56px;
        border-radius: 1rem;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-weight: 700;
      }
      .copy {
        display: grid;
        gap: 0.35rem;
        flex: 1;
      }
    `,
  ],
})
export class HistoryPageComponent {
  private readonly libraryService = inject(LibraryService);
  private readonly destroyRef = inject(DestroyRef);
  readonly items = signal<ReadingHistoryItem[]>([]);

  constructor() {
    this.libraryService.listHistory().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((response) => this.items.set(response.data));
  }
}
