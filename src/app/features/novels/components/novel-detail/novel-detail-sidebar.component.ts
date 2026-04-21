import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NovelDetail } from '../../../../core/models/novel.model';
import { GenreLabelPipe } from '../../../../shared/pipes/genre-label.pipe';

@Component({
  selector: 'app-novel-detail-sidebar',
  standalone: true,
  imports: [DatePipe, GenreLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="stats card">
      <h3>Estadisticas</h3>
      <span>{{ novel().stats.chaptersCount }} capitulos</span>
      <span>{{ novel().stats.kudosCount }} kudos</span>
      <span>{{ novel().stats.bookmarksCount }} guardados</span>
      <span>{{ novel().stats.votesCount }} votos</span>
      <span>{{ novel().stats.commentsCount }} comentarios</span>
      <span>{{ novel().stats.worldsCount }} mundos</span>
      <span>{{ novel().stats.charactersCount }} personajes</span>
      <span>{{ novel().viewsCount }} vistas</span>
      <span>Actualizada {{ novel().updatedAt | date: 'longDate' }}</span>
    </aside>

    <section class="related-block">
      <div class="section-head">
        <h2>Detalle</h2>
      </div>
      <div class="detail-card card">
        @if (novel().genres?.length) {
          <div class="detail-row">
            <span class="detail-label">Generos</span>
            <div class="chips-block">
              @for (g of novel().genres; track g.id) {
                <span class="chip chip-genre">{{ g | genreLabel }}</span>
              }
            </div>
          </div>
        }

        @if (novel().romanceGenres?.length) {
          <div class="detail-row">
            <span class="detail-label">Romance</span>
            <div class="chips-block">
              @for (rg of novel().romanceGenres; track rg.id) {
                <span class="romance-genre-badge">{{ rg.label }}</span>
              }
            </div>
          </div>
        }

        @if (novel().pairings?.length || pairingTagsList().length) {
          <div class="detail-row">
            <span class="detail-label">Parejas</span>
            <div class="pairings-block">
              @for (p of novel().pairings; track p.id) {
                <span class="pairing-pill" [class.is-main]="p.isMain">
                  @if (p.isMain) {
                    <span class="main-tag">&#9733; Principal</span>
                  }
                  {{ p.characterA.name }} &#215; {{ p.characterB.name }}
                </span>
              }
              @for (pt of pairingTagsList(); track pt) {
                <span class="pairing-pill">{{ pt }}</span>
              }
            </div>
          </div>
        }

        @if (nonPairingTagsList().length) {
          <div class="detail-row">
            <span class="detail-label">Etiquetas</span>
            <div class="chips-block">
              @for (t of nonPairingTagsList(); track t) {
                <span class="chip chip-tag">#{{ t }}</span>
              }
            </div>
          </div>
        }

        @if (novel().warnings?.length) {
          <div class="detail-row">
            <span class="detail-label">Advertencias</span>
            <div class="chips-block">
              @for (w of novel().warnings; track w) {
                <span class="chip chip-warning">&#9888; {{ w }}</span>
              }
            </div>
          </div>
        }

        <div class="detail-row">
          <span class="detail-label">Idioma</span>
          <span class="chip chip-meta">{{
            novel().language?.name || novel().language?.code || 'es'
          }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Estado</span>
          <span class="chip chip-meta">{{ novel().status }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Clasificacion</span>
          <span class="chip chip-meta">{{ novel().rating }}</span>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .stats,
      .card {
        display: grid;
        gap: 1rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        padding: 1.25rem;
      }
      .stats span {
        padding: 0.5rem 0.75rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        border: 0;
      }
      .related-block {
        display: grid;
        gap: 1rem;
      }
      .section-head {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 1.25rem;
      }
      .detail-card {
        display: grid;
        gap: 0.75rem;
        padding: 1.25rem;
      }
      .detail-row {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 0.75rem;
        align-items: start;
      }
      .detail-label {
        color: var(--text-3);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
        padding-top: 0.4rem;
      }
      .chips-block {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        font-size: 0.78rem;
        white-space: nowrap;
      }
      .chip-genre {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .chip-tag {
        background: rgba(122, 156, 220, 0.14);
        color: #9bb6e8;
        border: 1px solid rgba(122, 156, 220, 0.3);
      }
      .chip-warning {
        background: rgba(214, 154, 91, 0.12);
        color: #e0b07a;
        border: 1px solid rgba(214, 154, 91, 0.3);
      }
      .chip-meta {
        background: var(--bg-surface);
        color: var(--text-2);
        border: 1px solid var(--border);
      }
      .romance-genre-badge {
        padding: 0.4rem 0.8rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.85rem;
        font-weight: 600;
      }
      .pairings-block {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .pairing-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.8rem;
        border-radius: 999px;
        background: rgba(224, 85, 85, 0.12);
        color: #e89a9a;
        border: 1px solid rgba(224, 85, 85, 0.3);
        font-size: 0.85rem;
      }
      .pairing-pill.is-main {
        background: rgba(224, 85, 85, 0.22);
        color: #f0b0b0;
        border-color: rgba(224, 85, 85, 0.55);
        font-weight: 600;
      }
      .pairing-pill .main-tag {
        font-size: 0.7rem;
        opacity: 0.85;
      }
      @media (max-width: 640px) {
        .detail-row {
          grid-template-columns: 1fr;
          gap: 0.4rem;
        }
        .detail-label {
          padding-top: 0;
        }
      }
    `,
  ],
})
export class NovelDetailSidebarComponent {
  readonly novel = input.required<NovelDetail>();

  readonly pairingTagsList = computed(() => {
    const novel = this.novel();
    return (novel?.tags ?? [])
      .filter((t) => this.isPairingTag(t))
      .map((t) => {
        const [a, b] = t.split('/');
        return `${this.prettifyName(a)} \u00D7 ${this.prettifyName(b)}`;
      });
  });

  readonly nonPairingTagsList = computed(() => {
    const novel = this.novel();
    return (novel?.tags ?? []).filter((t) => !this.isPairingTag(t));
  });

  private isPairingTag(tag: string): boolean {
    if (!tag.includes('/')) return false;
    const parts = tag.split('/');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  }

  private prettifyName(s: string): string {
    return s
      .split('-')
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
}
