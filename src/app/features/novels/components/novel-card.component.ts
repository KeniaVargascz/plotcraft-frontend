import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NovelSummary } from '../../../core/models/novel.model';
import { AuthGateService } from '../../../core/services/auth-gate.service';
import { GenreLocalizationService } from '../../../core/services/genre-localization.service';
import { TranslationService } from '../../../core/services/translation.service';
import { GenreLabelPipe } from '../../../shared/pipes/genre-label.pipe';

@Component({
  selector: 'app-novel-card',
  standalone: true,
  imports: [RouterLink, DatePipe, GenreLabelPipe],
  template: `
    <article class="novel-card">
      <div class="status-row">
        <span class="badge badge-status" [class]="statusClass()">
          {{ statusLabel() }}
        </span>
        <span class="badge badge-rating">
          <span class="rating-full">{{ ratingFullLabel() }}</span>
          <span class="rating-short">{{ ratingLabel() }}</span>
        </span>
      </div>

      <div class="card-top">
        <a class="cover" [class]="coverClass()" (click)="onDetailClick()">
          <span class="cover-texture"></span>
          <span class="cover-letter">{{ novel().title.charAt(0) }}</span>
        </a>

        <div class="body">
          <a class="title" (click)="onDetailClick()">{{ novel().title }}</a>
          <p class="author">
            <a [routerLink]="['/perfil', novel().author.username]">
              @{{ novel().author.username }}
            </a>
          </p>
          @if (novel().language) {
            <span class="lang-label">{{ novel().language!.name }}</span>
          }
          @if (!synopsisOpen()) {
            <p class="synopsis">{{ novel().synopsis || 'Sin sinopsis.' }}</p>
          }
        </div>
      </div>

      @if (synopsisOpen()) {
        <div class="synopsis-full">
          <p>{{ novel().synopsis }}</p>
        </div>
      }
      @if (novel().synopsis && novel().synopsis!.length > 120) {
        <button type="button" class="synopsis-toggle" (click)="synopsisOpen.set(!synopsisOpen())">
          {{ synopsisOpen() ? 'Ver menos' : 'Ver mas' }}
        </button>
      }

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
                <span class="tag-pill tag-pill-genre">{{ genre | genreLabel }}</span>
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
              @for (warning of warnings(); track warning.slug) {
                <span class="tag-pill tag-pill-warning">{{ warning.label }}</span>
              }
            }
          </div>
        }
      }

      <footer class="card-footer">
        <div class="footer-row footer-stats">
          <span class="stat-item">
            <span class="stat-value">{{ publishedChaptersCount() }}</span>
            <span class="stat-label">caps</span>
          </span>
          <span class="divider"></span>
          <span class="stat-item">
            <span class="stat-value">{{ novel().stats.likesCount }}</span>
            <span class="stat-label">me gusta</span>
          </span>
          <span class="divider"></span>
          <span class="stat-item">
            <span class="stat-value">{{ novel().stats.votesCount }}</span>
            <span class="stat-label">votos</span>
          </span>
          <span class="divider"></span>
          <span class="stat-item">
            <span class="stat-value">{{ novel().viewsCount }}</span>
            <span class="stat-label">vistas</span>
          </span>
        </div>
        <div class="footer-row footer-dates">
          <span class="card-date">Publicada: {{ novel().createdAt | date: 'MM/dd/yyyy' }}</span>
          <span class="card-date">Actualizada: {{ novel().updatedAt | date: 'MM/dd/yyyy' }}</span>
        </div>
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
        background: var(--bg-card);
        border: 1px solid var(--border);
        overflow: hidden;
        box-shadow: 0 24px 44px var(--shadow);
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

      .cover-tone-0,
      .cover-tone-1,
      .cover-tone-2,
      .cover-tone-3 {
        background: linear-gradient(180deg, var(--bg-elevated), var(--bg-surface));
        color: var(--accent-text);
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

      .lang-label {
        color: var(--text-3);
        font-size: 0.72rem;
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
        gap: 0.38rem;
        min-width: 0;
        height: 100%;
        align-content: start;
      }

      .status-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.75rem 0.95rem 0;
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

      .badge-status-draft,
      .badge-status-in-progress,
      .badge-status-completed,
      .badge-status-archived,
      .badge-status-hiatus {
        background: var(--accent-glow);
        border-color: var(--border-s);
        color: var(--accent-text);
      }

      .badge-rating {
        background: color-mix(in srgb, var(--bg) 86%, rgba(255, 255, 255, 0.03));
        border: 1px solid var(--border);
        color: var(--text-2);
      }

      .rating-short {
        display: none;
      }

      @media (max-width: 400px) {
        .rating-full {
          display: none;
        }
        .rating-short {
          display: inline;
        }
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
        -webkit-line-clamp: 7;
        overflow: hidden;
      }

      .synopsis-full {
        padding: 8px 2rem;
      }

      .synopsis-full p {
        margin: 0;
        color: var(--text-2);
        font-size: 0.84rem;
        line-height: 1.55;
        text-align: justify;
      }

      .synopsis-toggle {
        background: none;
        border: none;
        color: var(--accent-text);
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0 2rem 1rem;
        min-height: unset;
        justify-self: end;
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
        border: 1px solid var(--border);
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
        border-top: 1px solid var(--border);
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
        border: 1px solid var(--border);
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
        border-top: 1px solid var(--border);
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

      .tag-pill-genre,
      .tag-pill-tag {
        background: var(--accent-glow);
        border-color: var(--border-s);
        color: var(--accent-text);
      }

      .tag-pill-warning {
        background: color-mix(in srgb, var(--danger) 12%, transparent);
        border-color: color-mix(in srgb, var(--danger) 24%, transparent);
        color: var(--danger);
      }

      .card-footer {
        display: grid;
        gap: 0;
        border-top: 1px solid var(--border);
      }

      .footer-row {
        display: flex;
        align-items: center;
        padding: 0.6rem 0.95rem;
      }

      .footer-stats {
        gap: 0.55rem;
        flex-wrap: wrap;
      }

      .footer-dates {
        gap: 0.75rem;
        border-top: 1px solid var(--border);
      }

      .stat-item {
        display: inline-flex;
        align-items: baseline;
        gap: 0.22rem;
        min-width: 0;
      }

      .stat-value {
        color: var(--text-1);
        font-size: 0.8rem;
        font-weight: 700;
      }

      .stat-label {
        color: var(--text-3);
        font-size: 0.72rem;
      }

      .divider {
        width: 1px;
        height: 0.75rem;
        background: var(--border);
        flex-shrink: 0;
      }

      .card-date {
        color: var(--text-3);
        font-size: 0.68rem;
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
  private readonly genreLocalization = inject(GenreLocalizationService);
  private readonly t = inject(TranslationService);
  readonly novel = input.required<NovelSummary>();
  readonly tagsOpen = signal(false);
  readonly synopsisOpen = signal(false);

  readonly genres = computed(() => this.novel().genres ?? []);
  readonly tags = computed(() => this.novel().tags ?? []);
  readonly warnings = computed(() => this.novel().warnings ?? []);
  readonly visibleGenreLabels = computed(() =>
    this.genres()
      .slice(0, 3)
      .map((genre) => this.genreLocalization.labelFor(genre)),
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
  readonly ratingFullLabel = computed(
    () => this.t.translate('novel.rating.' + this.novel().rating) || this.novel().rating,
  );
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
    return this.t.translate('novel.status.' + status) || status;
  }

  private formatRatingLabel(rating: NovelSummary['rating']): string {
    return this.t.translate('novel.ratingShort.' + rating) || rating;
  }

  private coverToneIndex(seed: string): number {
    return Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % 4;
  }
}
