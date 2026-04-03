import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DiscoverySnapshot } from '../../core/models/discovery.model';
import { DiscoveryService } from '../../core/services/discovery.service';
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
          <div class="rail">
            @for (novel of snapshot()!.trending.novels; track novel.id) {
              <div class="rail-item">
                <span class="trend-badge">{{ 'discovery.trending.badge' | translate }}</span>
                <app-novel-card [novel]="novel" />
              </div>
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>{{ 'discovery.newReleases.title' | translate }}</h2>
          </div>
          <div class="release-grid">
            @for (release of snapshot()!.new_releases; track release.novel.id) {
              <article class="release-card">
                <div class="release-head">
                  <div class="release-copy">
                    <a class="release-title" [routerLink]="['/novelas', release.novel.slug]">
                      {{ release.novel.title }}
                    </a>
                    <p class="release-author">{{ release.novel.author.displayName }}</p>
                  </div>
                  <span class="badge release-badge">
                    {{
                      'discovery.newReleases.newChapters'
                        | translate: { n: release.new_chapters_count }
                    }}
                  </span>
                </div>

                @if (release.latest_chapter) {
                  <div class="release-body">
                    <span class="release-label">Capitulo mas reciente</span>
                    <p class="release-chapter">
                      {{
                        'discovery.newReleases.latestChapter'
                          | translate: { title: release.latest_chapter.title }
                      }}
                    </p>
                  </div>
                }

                <div class="release-footer">
                  <span class="release-meta">
                    {{ release.novel.stats.publishedChaptersCount }} capitulos
                  </span>
                  <a class="release-link" [routerLink]="['/novelas', release.novel.slug]">
                    Ver novela
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
          </div>
          <div class="genre-grid">
            @for (genre of snapshot()!.genres_spotlight; track genre.genre.slug) {
              <article class="genre-card">
                <div class="section-head compact">
                  <strong>{{ genre.genre.label }}</strong>
                  <a [routerLink]="['/novelas']" [queryParams]="{ genre: genre.genre.slug }">
                    {{ 'discovery.genres.viewAll' | translate: { genre: genre.genre.label } }}
                  </a>
                </div>
                <div class="mini-grid">
                  @for (novel of genre.top_novels; track novel.id) {
                    <a [routerLink]="['/novelas', novel.slug]">{{ novel.title }}</a>
                  }
                </div>
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
            <a routerLink="/explorar">{{ 'discovery.community.viewFeed' | translate }}</a>
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

      .hero,
      .stats-banner,
      .release-card,
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
      .trend-badge,
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
        gap: 1rem;
        overflow-x: auto;
        padding-bottom: 0.3rem;
        scroll-snap-type: x proximity;
      }

      .rail-item {
        display: grid;
        gap: 0.75rem;
        align-content: start;
        scroll-snap-align: start;
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
        gap: 1rem;
        align-content: start;
      }

      .release-head,
      .release-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.9rem;
      }

      .release-copy {
        display: grid;
        gap: 0.3rem;
        min-width: 0;
      }

      .release-title {
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.3;
        overflow-wrap: anywhere;
      }

      .release-author,
      .release-label,
      .release-meta,
      .community-card span {
        color: var(--text-2);
      }

      .release-author {
        margin: 0;
        font-size: 0.94rem;
      }

      .release-badge {
        flex: 0 0 auto;
        max-width: 100%;
        text-align: center;
        white-space: normal;
      }

      .release-body {
        display: grid;
        gap: 0.4rem;
        padding: 0.9rem 1rem;
        border-radius: 1rem;
        background: color-mix(in srgb, var(--bg-surface) 76%, transparent);
        border: 1px solid var(--border);
      }

      .release-label {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.72rem;
      }

      .release-chapter {
        margin: 0;
        color: var(--text-1);
        line-height: 1.5;
      }

      .release-link {
        text-decoration: none;
        color: var(--accent-text);
        font-weight: 600;
        white-space: nowrap;
      }

      .genre-card {
        display: grid;
        gap: 1rem;
      }

      .genre-card .compact {
        align-items: start;
      }

      .genre-card strong {
        font-size: 1.05rem;
      }

      .genre-card .mini-grid {
        display: grid;
        gap: 0.55rem;
      }

      .genre-card .mini-grid a {
        padding: 0.75rem 0.85rem;
        border-radius: 0.9rem;
        background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
        border: 1px solid var(--border);
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
        .release-head,
        .release-footer {
          flex-direction: column;
        }

        .release-link {
          white-space: normal;
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

  readonly snapshot = signal<DiscoverySnapshot | null>(null);
  readonly loading = signal(true);

  constructor() {
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
}
