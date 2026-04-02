import { Component, inject, signal } from '@angular/core';
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
          <span>fragmentos guardados</span>
        </div>
      </header>

      @if (!items().length) {
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
              <p class="quote">Fragmento {{ item.start_offset }} - {{ item.end_offset }}</p>

              @if (item.note) {
                <p class="note">{{ item.note }}</p>
              }

              <div class="actions">
                <a
                  [routerLink]="['/novelas', item.novel.slug, item.chapter.slug]"
                  [fragment]="item.anchor_id"
                >
                  Ver en contexto
                </a>
                <button type="button" class="danger" (click)="remove(item.id)">Eliminar</button>
              </div>
            </article>
          }
        </section>
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
    `,
  ],
})
export class HighlightsPageComponent {
  private readonly highlightsService = inject(HighlightsService);
  readonly items = signal<Highlight[]>([]);

  constructor() {
    this.load();
  }

  remove(id: string) {
    this.highlightsService.remove(id).subscribe(() => this.load());
  }

  private load() {
    this.highlightsService.listAll().subscribe((items) => this.items.set(items));
  }
}
