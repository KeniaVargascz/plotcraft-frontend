import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NovelSummary } from '../../../core/models/novel.model';
import { AuthGateService } from '../../../core/services/auth-gate.service';

@Component({
  selector: 'app-novel-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <article class="novel-card">
      <div class="card-top">
        <a class="cover" [class]="coverClass()" (click)="onDetailClick()">
          <span class="cover-texture"></span>
          <span class="cover-letter">{{ novel().title.charAt(0) }}</span>
          @if (novel().language?.code && novel().language?.code !== 'es') {
            <span class="lang-badge">{{ novel().language?.code?.toUpperCase() }}</span>
          }
        </a>

        <div class="body">
          <div class="badges-row">
            <span class="badge badge-status" [class]="statusClass()">
              {{ statusLabel() }}
            </span>
            <span class="badge badge-rating">{{ ratingLabel() }}</span>
          </div>

          <a class="title" (click)="onDetailClick()">{{ novel().title }}</a>
          <p class="author">
            <a [routerLink]="['/perfil', novel().author.username]">
              @{{ novel().author.username }}
            </a>
          </p>
          <p class="synopsis">{{ novel().synopsis || 'Sin sinopsis.' }}</p>

          <div class="tags-row">
            @for (label of visibleGenreLabels(); track label) {
              <span class="tag-chip">{{ label }}</span>
            }
          </div>
        </div>
      </div>

      @if (hasExpandableTags()) {
        <button class="tags-toggle" type="button" (click)="toggleTags()">
          <span class="tags-toggle-label">
            Todos los tags
            <span class="tags-count">{{ expandableTagCount() }}</span>
          </span>
          <span class="tags-chevron" [class.open]="tagsOpen()">v</span>
        </button>

        @if (tagsOpen()) {
          <div class="tags-panel">
            @if (genres().length) {
              <span class="tag-type-label">Genero</span>
              @for (genre of genres(); track genre.id) {
                <span class="tag-pill tag-pill-genre">{{ genre.label }}</span>
              }
            }

            @if (tags().length) {
              <span class="tag-type-label">Tags</span>
              @for (tag of tags(); track tag) {
                <span class="tag-pill tag-pill-tag">{{ tag }}</span>
              }
            }

            @if (warnings().length) {
              <span class="tag-type-label">Warnings</span>
              @for (warning of warnings(); track warning) {
                <span class="tag-pill tag-pill-warning">{{ warning }}</span>
              }
            }
          </div>
        }
      }

      <footer class="card-footer">
        <div class="stats-group">
          <span class="stat-item">
            <span class="stat-value">{{ publishedChaptersCount() }}</span>
            <span class="stat-label">caps</span>
          </span>
          <span class="divider"></span>
          <span class="stat-item">
            <span class="stat-value">{{ novel().stats.likesCount }}</span>
            <span class="stat-label">likes</span>
          </span>
          <span class="divider"></span>
          <span class="stat-item">
            <span class="stat-value">{{ novel().viewsCount }}</span>
            <span class="stat-label">vistas</span>
          </span>
        </div>
        <span class="card-date">{{ novel().updatedAt | date: 'shortDate' }}</span>
      </footer>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .novel-card {
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto auto;
        height: 100%;
        border-radius: 1.35rem;
        background: color-mix(in srgb, var(--bg-card) 92%, #0b0f14 8%);
        border: 1px solid color-mix(in srgb, var(--border) 88%, rgba(255, 255, 255, 0.08));
        overflow: hidden;
        box-shadow: 0 24px 44px rgba(7, 10, 16, 0.18);
      }

      .card-top {
        display: grid;
        grid-template-columns: 88px 1fr;
        gap: 0.95rem;
        padding: 0.95rem;
        min-height: 0;
        height: 100%;
        align-items: start;
      }

      .cover {
        position: relative;
        display: grid;
        place-items: center;
        height: 132px;
        align-self: start;
        border-radius: 1rem;
        text-decoration: none;
        overflow: hidden;
        isolation: isolate;
        cursor: pointer;
      }

      .cover-tone-0 {
        background: linear-gradient(180deg, #1e2535, #121927);
        color: #89a0db;
      }

      .cover-tone-1 {
        background: linear-gradient(180deg, #1d2f2a, #101c18);
        color: #67ba98;
      }

      .cover-tone-2 {
        background: linear-gradient(180deg, #2d2033, #1a111f);
        color: #b589d7;
      }

      .cover-tone-3 {
        background: linear-gradient(180deg, #30261d, #1d1510);
        color: #d2a56a;
      }

      .cover-texture {
        position: absolute;
        inset: 0;
        opacity: 0.08;
        background-image: repeating-linear-gradient(
          45deg,
          currentColor 0,
          currentColor 1px,
          transparent 1px,
          transparent 7px
        );
      }

      .lang-badge {
        position: absolute;
        top: 0.35rem;
        right: 0.35rem;
        z-index: 2;
        padding: 0.12rem 0.4rem;
        border-radius: 0.35rem;
        background: rgba(0, 0, 0, 0.65);
        color: #fff;
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.05em;
      }

      .cover-letter {
        position: relative;
        z-index: 1;
        font:
          italic 400 2.3rem/1 'Playfair Display',
          serif;
      }

      .body {
        display: grid;
        grid-template-rows: minmax(3.45rem, auto) auto auto minmax(0, 1fr) auto;
        gap: 0.38rem;
        min-width: 0;
        height: 100%;
      }

      .badges-row {
        display: grid;
        grid-template-rows: repeat(2, 1.52rem);
        gap: 0.28rem;
        align-content: start;
        min-height: 3.45rem;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 1.55rem;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        font-size: 0.66rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
        width: fit-content;
      }

      .badge-status {
        border: 1px solid transparent;
      }

      .badge-status-draft {
        background: rgba(176, 138, 82, 0.12);
        border-color: rgba(176, 138, 82, 0.28);
        color: #d4ac6b;
      }

      .badge-status-in-progress {
        background: rgba(91, 175, 214, 0.12);
        border-color: rgba(91, 175, 214, 0.28);
        color: #77c4ea;
      }

      .badge-status-completed {
        background: rgba(77, 184, 138, 0.12);
        border-color: rgba(77, 184, 138, 0.28);
        color: #63d4a2;
      }

      .badge-status-archived {
        background: rgba(148, 161, 189, 0.12);
        border-color: rgba(148, 161, 189, 0.28);
        color: #bac6dc;
      }

      .badge-rating {
        background: color-mix(in srgb, var(--bg) 86%, rgba(255, 255, 255, 0.03));
        border: 1px solid color-mix(in srgb, var(--border) 88%, rgba(255, 255, 255, 0.08));
        color: var(--text-2);
      }

      .title {
        color: var(--text-1);
        text-decoration: none;
        cursor: pointer;
        font:
          700 1.08rem/1.25 'Playfair Display',
          serif;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        min-height: calc(1.25em * 2);
      }

      .author,
      .synopsis {
        margin: 0;
      }

      .author {
        min-height: 1.1rem;
        color: var(--accent-text);
        font-size: 0.82rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .author a {
        color: inherit;
        text-decoration: none;
      }

      .synopsis {
        color: var(--text-2);
        font-size: 0.84rem;
        line-height: 1.45;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        min-height: calc(1.45em * 2);
      }

      .tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-content: start;
        min-height: 3.55rem;
        max-height: 3.55rem;
        overflow: hidden;
      }

      .tag-chip {
        display: inline-flex;
        align-items: center;
        max-width: 100%;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--border) 88%, rgba(255, 255, 255, 0.08));
        background: color-mix(in srgb, var(--bg) 76%, transparent);
        color: var(--text-2);
        font-size: 0.72rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tags-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        width: 100%;
        min-height: 3rem;
        padding: 0.75rem 0.95rem;
        background: transparent;
        border: 0;
        border-top: 1px solid color-mix(in srgb, var(--border) 88%, rgba(255, 255, 255, 0.08));
        color: var(--text-2);
        cursor: pointer;
      }

      .tags-toggle:hover {
        background: color-mix(in srgb, var(--bg) 70%, transparent);
      }

      .tags-toggle-label {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.74rem;
        font-weight: 700;
      }

      .tags-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.3rem;
        min-height: 1.3rem;
        padding: 0 0.35rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--bg) 82%, transparent);
        border: 1px solid color-mix(in srgb, var(--border) 88%, rgba(255, 255, 255, 0.08));
        font-size: 0.68rem;
      }

      .tags-chevron {
        color: var(--text-3);
        font-size: 1rem;
        line-height: 1;
        transition: transform 0.2s ease;
      }

      .tags-chevron.open {
        transform: rotate(180deg);
      }

      .tags-panel {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        padding: 0.85rem 0.95rem 1rem;
        border-top: 1px solid color-mix(in srgb, var(--border) 88%, rgba(255, 255, 255, 0.08));
        background: color-mix(in srgb, var(--bg) 78%, transparent);
      }

      .tag-type-label {
        width: 100%;
        margin-top: 0.15rem;
        color: var(--text-3);
        font-size: 0.63rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .tag-type-label:first-child {
        margin-top: 0;
      }

      .tag-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.22rem 0.62rem;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 0.72rem;
        white-space: nowrap;
      }

      .tag-pill-genre {
        background: rgba(91, 175, 214, 0.12);
        border-color: rgba(91, 175, 214, 0.24);
        color: #77c4ea;
      }

      .tag-pill-tag {
        background: rgba(181, 137, 215, 0.12);
        border-color: rgba(181, 137, 215, 0.24);
        color: #c29be0;
      }

      .tag-pill-warning {
        background: rgba(214, 120, 120, 0.12);
        border-color: rgba(214, 120, 120, 0.24);
        color: #e49d9d;
      }

      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.65rem;
        min-height: 3.1rem;
        padding: 0.8rem 0.95rem 0.9rem;
        border-top: 1px solid color-mix(in srgb, var(--border) 88%, rgba(255, 255, 255, 0.08));
      }

      .stats-group {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        min-width: 0;
      }

      .stat-item {
        display: inline-flex;
        align-items: baseline;
        gap: 0.28rem;
        min-width: 0;
      }

      .stat-value {
        color: var(--text-1);
        font-size: 0.83rem;
        font-weight: 700;
      }

      .stat-label,
      .card-date {
        color: var(--text-3);
        font-size: 0.72rem;
      }

      .divider {
        width: 1px;
        height: 0.9rem;
        background: color-mix(in srgb, var(--border) 88%, rgba(255, 255, 255, 0.08));
        flex-shrink: 0;
      }

      .card-date {
        white-space: nowrap;
      }

      @media (max-width: 700px) {
        .card-top {
          grid-template-columns: 72px 1fr;
          gap: 0.8rem;
          padding: 0.8rem;
        }

        .cover {
          height: 112px;
        }

        .card-footer {
          flex-direction: column;
          align-items: flex-start;
        }

        .stats-group {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class NovelCardComponent {
  private readonly authGate = inject(AuthGateService);
  readonly novel = input.required<NovelSummary>();
  readonly tagsOpen = signal(false);

  readonly genres = computed(() => this.novel().genres ?? []);
  readonly tags = computed(() => this.novel().tags ?? []);
  readonly warnings = computed(() => this.novel().warnings ?? []);
  readonly visibleGenreLabels = computed(() =>
    this.genres()
      .slice(0, 3)
      .map((genre) => genre.label),
  );
  readonly expandableTagCount = computed(
    () => this.genres().length + this.tags().length + this.warnings().length,
  );
  readonly hasExpandableTags = computed(() => this.expandableTagCount() > 0);
  readonly publishedChaptersCount = computed(() => {
    const stats = this.novel().stats as NovelSummary['stats'] & { publishedChaptersCount?: number };
    return stats.publishedChaptersCount ?? stats.chaptersCount ?? 0;
  });
  readonly statusLabel = computed(() => this.formatStatusLabel(this.novel().status));
  readonly ratingLabel = computed(() => this.formatRatingLabel(this.novel().rating));
  readonly statusClass = computed(
    () => `badge-status-${this.novel().status.toLowerCase().replace(/_/g, '-')}`,
  );
  readonly coverClass = computed(
    () => `cover cover-tone-${this.coverToneIndex(this.novel().slug)}`,
  );

  onDetailClick(): void {
    this.authGate.navigate(['/novelas', this.novel().slug]);
  }

  toggleTags(): void {
    this.tagsOpen.update((value) => !value);
  }

  private formatStatusLabel(status: NovelSummary['status']): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'En progreso';
      case 'COMPLETED':
        return 'Completada';
      case 'ARCHIVED':
        return 'Archivada';
      case 'DRAFT':
      default:
        return 'Borrador';
    }
  }

  private formatRatingLabel(rating: NovelSummary['rating']): string {
    switch (rating) {
      case 'T':
        return 'T';
      case 'EXPLICIT':
        return '18+';
      default:
        return rating;
    }
  }

  private coverToneIndex(seed: string): number {
    return Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % 4;
  }
}
