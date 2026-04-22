import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Highlight } from '../../core/models/highlight.model';
import { HighlightsService } from '../../core/services/highlights.service';

@Component({
  selector: 'app-highlights-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="highlights-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Biblioteca</p>
          <h1>Subrayados</h1>
          <p class="lede">
            Tus fragmentos destacados, notas y accesos rapidos al contexto original.
          </p>
        </div>
        <div class="hero-stat">
          <strong>{{ items().length }}</strong>
          <span>fragmentos cargados</span>
        </div>
      </header>

      @if (!items().length && !loading()) {
        <section class="empty-state card">
          <h2>Aun no has subrayado ningun fragmento</h2>
          <p>Usa el lector para destacar pasajes y construir tu archivo de referencias.</p>
        </section>
      } @else {
        <section class="grid">
          @for (item of items(); track item.id) {
            <article class="highlight-card card" [style.border-left-color]="item.color">
              <div class="row">
                <div>
                  <strong>{{ item.novel.title }}</strong>
                  <p>{{ item.chapter.title }}</p>
                </div>
                <span class="color-dot" [style.background]="item.color"></span>
              </div>
              <p class="quote">Fragmento {{ item.startOffset }} - {{ item.endOffset }}</p>

              @if (item.note) {
                <p class="note">{{ item.note }}</p>
              }

              <div class="actions">
                <a
                  [routerLink]="['/novelas', item.novel.slug, item.chapter.slug]"
                  [fragment]="item.anchorId"
                >
                  Ver en contexto
                </a>
                <button type="button" class="danger" (click)="remove(item.id)">Eliminar</button>
              </div>
            </article>
          }
        </section>

        @if (hasMore()) {
          <button type="button" class="load-more" [disabled]="loading()" (click)="loadMore()">
            {{ loading() ? 'Cargando...' : 'Cargar mas' }}
          </button>
        }
      }
    </section>
  `,
  styles: [
    `
      .highlights-shell,
      .grid {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.25rem;
        border: 1px solid var(--border);
        border-left-width: 6px;
        border-radius: 1.25rem;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--bg-card) 92%, white 8%),
          var(--bg-card)
        );
        box-shadow: 0 12px 30px color-mix(in srgb, var(--bg) 82%, transparent);
      }
      .hero {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .eyebrow,
      .lede,
      .row p,
      .note {
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
      .highlight-card,
      .row {
        display: grid;
        gap: 1rem;
      }
      .row,
      .actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .quote {
        margin: 0;
        padding: 1rem;
        border-radius: 1rem;
        background: var(--bg-surface);
      }
      .color-dot {
        width: 18px;
        height: 18px;
        border-radius: 999px;
      }
      .actions a,
      .actions button {
        border-radius: 0.95rem;
        border: 1px solid var(--border);
        padding: 0.85rem 1rem;
        text-decoration: none;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .actions .danger {
        background: color-mix(in srgb, #b42318 16%, var(--bg-card));
        color: #b42318;
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
})
export class HighlightsPageComponent {
  private readonly highlightsService = inject(HighlightsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly items = signal<Highlight[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  private cursor: string | null = null;

  constructor() {
    this.fetch(true);
  }

  remove(id: string) {
    this.highlightsService.remove(id).subscribe(() => {
      this.items.update((list) => list.filter((h) => h.id !== id));
    });
  }

  loadMore() {
    this.fetch(false);
  }

  private fetch(reset: boolean) {
    this.loading.set(true);
    this.highlightsService.listAll({ cursor: reset ? null : this.cursor, limit: 20 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.items.update((list) => (reset ? res.data : [...list, ...res.data]));
        this.cursor = res.pagination.nextCursor;
        this.hasMore.set(res.pagination.hasMore);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
