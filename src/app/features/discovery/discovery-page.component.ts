import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DiscoverySnapshot } from '../../core/models/discovery.model';
import { Genre } from '../../core/models/genre.model';
import { DiscoveryService } from '../../core/services/discovery.service';
import { GenresService } from '../../core/services/genres.service';
import { HighlightPipe } from '../../shared/pipes/highlight.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CharacterCardComponent } from '../characters/components/character-card.component';
import { NovelCardComponent } from '../novels/components/novel-card.component';
import { WorldCardComponent } from '../worlds/components/world-card.component';
import { AuthorCardComponent } from './components/author-card.component';

@Component({
  selector: 'app-discovery-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    HighlightPipe,
    TranslatePipe,
    NovelCardComponent,
    WorldCardComponent,
    CharacterCardComponent,
    AuthorCardComponent,
  ],
  template: `
    <section class="discovery-page">
      <header class="hero">
        <div class="hero-copy">
          <p class="eyebrow">{{ 'discovery.title' | translate }}</p>
          <h1>{{ 'discovery.subtitle' | translate }}</h1>
        </div>
        <button type="button" class="refresh-button" (click)="load(true)">Recargar</button>
      </header>

      @if (loading()) {
        <div class="loading-shell">{{ 'common.loading' | translate }}</div>
      } @else if (!snapshot()) {
        <div class="loading-shell">{{ 'discovery.empty' | translate }}</div>
      } @else {
        <section class="stats-banner">
          <span>
            {{ snapshot()!.stats.total_novels }}
            {{ 'discovery.stats.novels' | translate }}
          </span>
          <span>
            {{ snapshot()!.stats.total_authors }}
            {{ 'discovery.stats.authors' | translate }}
          </span>
          <span>
            {{ snapshot()!.stats.total_worlds }}
            {{ 'discovery.stats.worlds' | translate }}
          </span>
          <span>
            {{ snapshot()!.stats.total_characters }}
            {{ 'discovery.stats.characters' | translate }}
          </span>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>{{ 'discovery.trending.novels' | translate }}</h2>
          </div>
          <div class="rail" data-testid="trending-novels">
            @for (novel of snapshot()!.trending.novels; track novel.id) {
              <div class="rail-item">
                <app-novel-card [novel]="novel" />
              </div>
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>{{ 'discovery.newReleases.title' | translate }}</h2>
          </div>
          <div class="release-grid" data-testid="new-releases">
            @for (release of snapshot()!.new_releases; track release.novel.id; let index = $index) {
              <article class="release-card">
                <div class="release-strip" [class]="releaseToneClass(index)"></div>

                <div class="release-head">
                  <div class="release-copy">
                    <div class="release-title-row">
                      <a class="release-title" [routerLink]="['/novelas', release.novel.slug]">
                        {{ release.novel.title }}
                      </a>
                      <span class="release-badge"> +{{ release.new_chapters_count }} </span>
                    </div>
                    <p class="release-author">@{{ release.novel.author.username }}</p>
                  </div>
                </div>

                @if (release.latest_chapter) {
                  <div class="release-body">
                    <span class="release-label">Capitulo mas reciente</span>
                    <p class="release-chapter">
                      {{ release.latest_chapter.title }}
                    </p>
                    <span class="release-published-at">
                      {{ release.latest_chapter.publishedAt | date: 'shortDate' }}
                    </span>
                  </div>
                }

                <div class="release-footer">
                  <span class="release-meta">
                    <span class="release-meta-value">
                      {{ release.novel.stats.publishedChaptersCount }}
                    </span>
                    {{
                      release.novel.stats.publishedChaptersCount === 1 ? 'capitulo' : 'capitulos'
                    }}
                  </span>
                  <a class="release-link" [routerLink]="['/novelas', release.novel.slug]">
                    Ver novela
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>{{ 'discovery.trending.authors' | translate }}</h2>
          </div>
          <div class="rail">
            @for (author of snapshot()!.trending.authors; track author.id) {
              <app-author-card [author]="author" />
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>{{ 'discovery.genres.title' | translate }}</h2>
            <a [routerLink]="['/novelas/generos']">Explorar todos los generos</a>
          </div>
          <div class="genre-grid">
            @for (genre of visibleGenres(); track genre.id; let index = $index) {
              <a
                class="genre-card genre-link"
                [class]="genreToneClass(index)"
                [routerLink]="['/novelas/genero', genre.slug]"
              >
                <span class="genre-accent"></span>
                <div class="genre-copy">
                  <strong>{{ genre.label }}</strong>
                  <span class="genre-hint">Ver todas las novelas de este genero</span>
                </div>
                <span class="genre-action">
                  Explorar
                  <span aria-hidden="true">↗</span>
                </span>
              </a>
            }

            @if (!genres().length) {
              <article class="genre-card">
                <strong>No hay generos disponibles</strong>
                <p>Aun no hay generos cargados para explorar.</p>
              </article>
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>{{ 'discovery.trending.worlds' | translate }}</h2>
          </div>
          <div class="rail">
            @for (world of snapshot()!.trending.worlds; track world.id) {
              <app-world-card [world]="world" />
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>{{ 'discovery.trending.characters' | translate }}</h2>
          </div>
          <div class="rail">
            @for (character of snapshot()!.trending.characters; track character.id) {
              <app-character-card [character]="character" />
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>{{ 'discovery.community.title' | translate }}</h2>
            <a routerLink="/feed">{{ 'discovery.community.viewFeed' | translate }}</a>
          </div>
          <div class="community-list">
            @for (post of snapshot()!.community_posts; track post.id) {
              <article class="community-card" [routerLink]="['/feed']">
                <p [innerHTML]="post.content_excerpt | highlight: ''"></p>
                <span>
                  {{ post.author.display_name }} · {{ post.stats.reactions_count }} reacciones
                </span>
              </article>
            }
          </div>
        </section>
      }
    </section>
  `,
  styles: [
    `
      .discovery-page,
      .section {
        display: grid;
        gap: 1.25rem;
      }

      .discovery-page {
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--accent) 38%, var(--border))
          color-mix(in srgb, var(--bg-surface) 82%, transparent);
      }

      .discovery-page::-webkit-scrollbar {
        width: 0.75rem;
      }

      .discovery-page::-webkit-scrollbar-track {
        background: color-mix(in srgb, var(--bg-surface) 84%, transparent);
        border-radius: 999px;
      }

      .discovery-page::-webkit-scrollbar-thumb {
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--accent) 52%, #f4d29b),
          color-mix(in srgb, var(--accent) 34%, var(--border))
        );
        border: 2px solid color-mix(in srgb, var(--bg-surface) 84%, transparent);
        border-radius: 999px;
      }

      .discovery-page::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--accent) 68%, #f6ddb3),
          color-mix(in srgb, var(--accent) 46%, var(--border-s))
        );
      }

      .hero,
      .stats-banner,
      .genre-card,
      .community-card,
      .loading-shell {
        padding: 1.2rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }

      .hero,
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .hero {
        padding: 1.5rem;
        align-items: end;
      }

      .hero-copy {
        display: grid;
        gap: 0.35rem;
      }

      .hero h1,
      .section-head h2 {
        margin: 0;
      }

      .eyebrow {
        margin: 0;
        color: var(--text-2);
      }

      .refresh-button,
      .badge {
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--accent-glow);
        color: var(--accent-text);
        padding: 0.55rem 0.9rem;
      }

      .refresh-button {
        cursor: pointer;
        font-weight: 600;
      }

      .stats-banner {
        display: none;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .stats-banner span {
        display: inline-flex;
        align-items: center;
        padding: 0.75rem 1rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
        border: 1px solid var(--border);
      }

      .rail {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(280px, 360px);
        grid-auto-rows: 1fr;
        gap: 1rem;
        overflow-x: auto;
        padding-bottom: 0.3rem;
        scroll-snap-type: x proximity;
        align-items: stretch;
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--accent) 34%, var(--border))
          color-mix(in srgb, var(--bg-surface) 86%, transparent);
      }

      .rail::-webkit-scrollbar {
        height: 0.72rem;
      }

      .rail::-webkit-scrollbar-track {
        background: color-mix(in srgb, var(--bg-surface) 86%, transparent);
        border: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
        border-radius: 999px;
      }

      .rail::-webkit-scrollbar-thumb {
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--accent) 50%, #f3c98e),
          color-mix(in srgb, var(--accent) 30%, var(--border))
        );
        border: 2px solid color-mix(in srgb, var(--bg-surface) 86%, transparent);
        border-radius: 999px;
      }

      .rail::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--accent) 66%, #f5ddb7),
          color-mix(in srgb, var(--accent) 42%, var(--border-s))
        );
      }

      .rail-item {
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 0.75rem;
        align-content: stretch;
        scroll-snap-align: start;
        height: 100%;
      }

      .release-grid,
      .genre-grid,
      .community-list {
        display: grid;
        gap: 1rem;
      }

      .release-grid,
      .genre-grid {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .release-card {
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto;
        gap: 0;
        padding: 0;
        overflow: hidden;
        border-radius: 1.25rem;
        border: 1px solid color-mix(in srgb, var(--border) 86%, rgba(255, 255, 255, 0.06));
        background: color-mix(in srgb, var(--bg-card) 94%, #0c1218 6%);
        box-shadow: 0 18px 36px rgba(7, 10, 16, 0.14);
      }

      .release-strip {
        height: 0.35rem;
      }

      .release-tone-0 {
        background: linear-gradient(90deg, #6b7cff, #8ea6ff);
      }

      .release-tone-1 {
        background: linear-gradient(90deg, #bc7f5a, #dfaf7f);
      }

      .release-tone-2 {
        background: linear-gradient(90deg, #4f9d76, #79c89e);
      }

      .release-tone-3 {
        background: linear-gradient(90deg, #8e5bbd, #b98cdf);
      }

      .release-head,
      .release-footer {
        padding-inline: 1rem;
      }

      .release-copy {
        display: grid;
        gap: 0.4rem;
        min-width: 0;
      }

      .release-head {
        padding-top: 1rem;
        padding-bottom: 0.85rem;
      }

      .release-title-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.8rem;
      }

      .release-title {
        font:
          400 1.03rem/1.3 'Playfair Display',
          serif;
        color: var(--text-1);
        text-decoration: none;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: calc(1.3em * 2);
        flex: 1;
        min-width: 0;
      }

      .release-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        min-height: 1.65rem;
        padding: 0.18rem 0.6rem;
        border-radius: 999px;
        border: 1px solid rgba(93, 184, 122, 0.3);
        background: rgba(39, 74, 51, 0.24);
        color: #7ed39b;
        font-size: 0.72rem;
        font-weight: 700;
        line-height: 1.3;
        white-space: nowrap;
      }

      .release-author {
        margin: 0;
        color: var(--text-3);
        font-size: 0.8rem;
      }

      .release-body {
        display: grid;
        gap: 0.32rem;
        margin: 0 1rem 1rem;
        padding: 0.9rem 0.95rem;
        border-radius: 1rem;
        background: color-mix(in srgb, var(--bg-surface) 82%, #0c1218 18%);
        border: 1px solid color-mix(in srgb, var(--border) 82%, rgba(255, 255, 255, 0.04));
      }

      .release-label {
        color: var(--text-3);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.64rem;
        font-weight: 700;
      }

      .release-chapter {
        margin: 0;
        color: var(--text-1);
        line-height: 1.45;
        font-size: 0.92rem;
      }

      .release-published-at {
        color: var(--text-3);
        font-size: 0.76rem;
      }

      .release-meta,
      .community-card span {
        color: var(--text-2);
      }

      .release-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.9rem;
        padding-top: 0.78rem;
        padding-bottom: 0.9rem;
        border-top: 1px solid color-mix(in srgb, var(--border) 82%, rgba(255, 255, 255, 0.04));
      }

      .release-meta {
        display: inline-flex;
        align-items: center;
        gap: 0.38rem;
        font-size: 0.82rem;
      }

      .release-meta::before {
        content: '';
        width: 0.9rem;
        height: 0.9rem;
        border-radius: 0.28rem;
        background:
          linear-gradient(var(--text-3), var(--text-3)) center 25% / 70% 2px no-repeat,
          linear-gradient(var(--text-3), var(--text-3)) center 50% / 70% 2px no-repeat,
          linear-gradient(var(--text-3), var(--text-3)) center 75% / 55% 2px no-repeat;
        opacity: 0.55;
      }

      .release-meta-value {
        color: var(--text-1);
        font-weight: 700;
      }

      .release-link {
        color: var(--accent-text);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.28rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .genre-card {
        display: grid;
        gap: 1rem;
      }

      .genre-link {
        position: relative;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        min-height: 9.5rem;
        align-content: space-between;
        transition:
          transform 160ms ease,
          border-color 160ms ease,
          background 160ms ease;
      }

      .genre-link:hover {
        transform: translateY(-2px);
        border-color: var(--border-s);
        background: color-mix(in srgb, var(--bg-card) 82%, var(--accent-glow));
      }

      .genre-tone-0 .genre-accent {
        background: linear-gradient(180deg, #6b7cff, #8ea6ff);
      }

      .genre-tone-1 .genre-accent {
        background: linear-gradient(180deg, #4f9d76, #79c89e);
      }

      .genre-tone-2 .genre-accent {
        background: linear-gradient(180deg, #8e5bbd, #b98cdf);
      }

      .genre-tone-3 .genre-accent {
        background: linear-gradient(180deg, #bc7f5a, #dfaf7f);
      }

      .genre-accent {
        position: absolute;
        inset: 0 auto 0 0;
        width: 0.35rem;
        border-radius: 1.25rem 0 0 1.25rem;
      }

      .genre-copy {
        display: grid;
        gap: 0.45rem;
        padding-left: 0.2rem;
      }

      .genre-card strong {
        font-size: 1.05rem;
        color: var(--text-1);
      }

      .genre-hint,
      .genre-card p {
        margin: 0;
        color: var(--text-2);
        line-height: 1.5;
      }

      .genre-action {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--accent-text);
        font-weight: 600;
      }

      .genre-card a,
      .community-card,
      .release-card a,
      .section-head a {
        text-decoration: none;
        color: inherit;
      }

      .section-head a {
        color: var(--accent-text);
        font-weight: 600;
      }

      .community-card {
        display: grid;
        gap: 0.7rem;
        cursor: pointer;
        transition:
          transform 160ms ease,
          border-color 160ms ease,
          background 160ms ease;
      }

      .community-card p {
        margin: 0;
        line-height: 1.6;
      }

      .community-card:hover {
        transform: translateY(-2px);
        border-color: var(--border-s);
        background: color-mix(in srgb, var(--bg-card) 82%, var(--accent-glow));
      }

      .loading-shell {
        text-align: center;
      }

      @media (max-width: 840px) {
        .hero,
        .section-head.compact {
          flex-direction: column;
          align-items: start;
        }
      }

      @media (max-width: 720px) {
        .release-footer {
          flex-direction: column;
          align-items: flex-start;
        }

        .release-link {
          white-space: normal;
        }

        .release-title-row {
          flex-direction: column;
        }

        .rail {
          grid-auto-columns: minmax(240px, 82vw);
        }
      }

      @media (min-width: 901px) {
        .stats-banner {
          display: flex;
        }
      }
    `,
  ],
})
export class DiscoveryPageComponent {
  private readonly discoveryService = inject(DiscoveryService);
  private readonly genresService = inject(GenresService);

  readonly snapshot = signal<DiscoverySnapshot | null>(null);
  readonly loading = signal(true);
  readonly genres = signal<Genre[]>([]);
  readonly visibleGenres = computed(() => this.genres().slice(0, 4));

  constructor() {
    this.genresService.list().subscribe({
      next: (genres) => this.genres.set(genres),
      error: () => this.genres.set([]),
    });
    this.load();
  }

  load(refresh = false) {
    this.loading.set(true);
    this.discoveryService.getSnapshot(refresh).subscribe({
      next: (snapshot) => {
        this.snapshot.set(snapshot);
        this.loading.set(false);
      },
      error: () => {
        this.snapshot.set(null);
        this.loading.set(false);
      },
    });
  }

  releaseToneClass(index: number) {
    return `release-tone-${index % 4}`;
  }

  genreToneClass(index: number) {
    return `genre-tone-${index % 4}`;
  }
}
