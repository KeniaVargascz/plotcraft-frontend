import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERIES_STATUS_LABELS, SERIES_TYPE_LABELS, SeriesSummary } from '../../models/series.model';

@Component({
  selector: 'app-series-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="series-card">
      <a class="cover-wrap" [routerLink]="['/sagas', series().slug]">
        @if (series().coverUrl) {
          <img [src]="series().coverUrl" [alt]="series().title" loading="lazy" />
        } @else if (collageCovers().length) {
          <div class="collage" [class.collage-3]="collageCovers().length >= 3">
            @for (c of collageCovers(); track $index) {
              @if (c) {
                <img [src]="c" [alt]="''" loading="lazy" />
              } @else {
                <span class="collage-placeholder"></span>
              }
            }
          </div>
        } @else {
          <div class="cover-placeholder">{{ series().title.charAt(0) }}</div>
        }
        <span class="type-badge">{{ typeLabel() }}</span>
      </a>
      <div class="body">
        <a class="title" [routerLink]="['/sagas', series().slug]">{{ series().title }}</a>
        <a class="author" [routerLink]="['/perfil', series().author.username]">
          @if (series().author.avatarUrl) {
            <img class="avatar" [src]="series().author.avatarUrl" alt="" loading="lazy" />
          } @else {
            <span class="avatar avatar-fallback">{{ series().author.displayName.charAt(0) }}</span>
          }
          <span>{{ series().author.displayName }}</span>
        </a>
        <div class="footer-row">
          <span class="status-badge" [class]="statusClass()">{{ statusLabel() }}</span>
          <span class="count">{{ series().novelsCount }} novelas</span>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .series-card {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 1rem;
        padding: 1rem;
        border-radius: 1.25rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
      }
      .cover-wrap {
        position: relative;
        display: block;
        height: 170px;
        border-radius: 0.85rem;
        overflow: hidden;
        text-decoration: none;
      }
      .cover-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .cover-placeholder {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #1e2535, #121927);
        color: #89a0db;
        font:
          italic 400 2.5rem 'Playfair Display',
          serif;
      }
      .collage {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
      }
      .collage-3 {
        grid-template-rows: 1fr 1fr;
      }
      .collage img,
      .collage-placeholder {
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: var(--bg-surface);
      }
      .type-badge {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .body {
        display: grid;
        gap: 0.5rem;
        align-content: start;
      }
      .title {
        color: var(--text-1);
        text-decoration: none;
        font:
          700 1.1rem/1.3 'Playfair Display',
          serif;
      }
      .author {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--text-2);
        text-decoration: none;
        font-size: 0.8rem;
      }
      .avatar {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        object-fit: cover;
      }
      .avatar-fallback {
        display: grid;
        place-items: center;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.7rem;
        font-weight: 700;
      }
      .footer-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: auto;
      }
      .status-badge {
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .status-in-progress {
        background: rgba(91, 175, 214, 0.15);
        color: #77c4ea;
      }
      .status-completed {
        background: rgba(77, 184, 138, 0.15);
        color: #63d4a2;
      }
      .status-abandoned {
        background: rgba(214, 120, 120, 0.15);
        color: #e49d9d;
      }
      .status-hiatus {
        background: rgba(176, 138, 82, 0.15);
        color: #d4ac6b;
      }
      .count {
        color: var(--text-3);
        font-size: 0.78rem;
      }
    `,
  ],
})
export class SeriesCardComponent {
  readonly series = input.required<SeriesSummary>();

  readonly typeLabel = computed(() => SERIES_TYPE_LABELS[this.series().type]);
  readonly statusLabel = computed(() => SERIES_STATUS_LABELS[this.series().status]);
  readonly statusClass = computed(
    () => `status-${this.series().status.toLowerCase().replace(/_/g, '-')}`,
  );
  readonly collageCovers = computed(() =>
    (this.series().novelCovers ?? []).filter((c) => !!c).slice(0, 3),
  );
}
