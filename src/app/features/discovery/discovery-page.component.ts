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
import { CommunityCardComponent } from '../communities/components/community-card/community-card.component';
import { CommunityService } from '../communities/services/community.service';
import { Community } from '../communities/models/community.model';

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
    CommunityCardComponent,
  ],
  template: `
    <section class="discovery-page">
      <header class="hero">
        <div class="hero-copy">
          <p class="eyebrow">{{ 'discovery.title' | translate }}</p>
          <h1>{{ 'discovery.subtitle' | translate }}</h1>
        </div>
        <button type="button" class="refresh-button" aria-label="Recargar" (click)="load(true)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
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
            <h2><svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>{{ 'discovery.trending.novels' | translate }}</h2>
            <a routerLink="/novelas">Ver mas en novelas</a>
          </div>
          @if (snapshot()!.trending.novels.length) {
            <div class="rail" data-testid="trending-novels">
              @for (novel of snapshot()!.trending.novels; track novel.id) {
                <div class="rail-item">
                  <app-novel-card [novel]="novel" />
                </div>
              }
            </div>
          } @else {
            <p class="empty-section">No hay novelas destacadas disponibles.</p>
          }
        </section>

        <section class="section">
          <div class="section-head">
            <h2><svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>{{ 'discovery.newReleases.title' | translate }}</h2>
            <a routerLink="/novelas">Ver mas en novelas</a>
          </div>
          @if (snapshot()!.new_releases.length) {
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
          } @else {
            <p class="empty-section">No hay lanzamientos recientes disponibles.</p>
          }
        </section>

        <section class="section">
          <div class="section-head">
            <h2><svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{{ 'discovery.trending.authors' | translate }}</h2>
            <a routerLink="/descubrir">Ver mas autores</a>
          </div>
          @if (snapshot()!.trending.authors.length) {
            <div class="rail">
              @for (author of snapshot()!.trending.authors; track author.id) {
                <app-author-card [author]="author" />
              }
            </div>
          } @else {
            <p class="empty-section">No hay autores destacados disponibles.</p>
          }
        </section>

        <section class="section">
          <div class="section-head">
            <h2><svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="13" y2="10"/></svg>{{ 'discovery.genres.title' | translate }}</h2>
            <a [routerLink]="['/novelas/generos']">Ver mas generos</a>
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
              <p class="empty-section">No hay generos disponibles.</p>
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2><svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>{{ 'discovery.trending.worlds' | translate }}</h2>
            <a routerLink="/mundos">Ver mas en mundos</a>
          </div>
          @if (snapshot()!.trending.worlds.length) {
            <div class="rail">
              @for (world of snapshot()!.trending.worlds; track world.id) {
                <app-world-card [world]="world" />
              }
            </div>
          } @else {
            <p class="empty-section">No hay mundos destacados disponibles.</p>
          }
        </section>

        <section class="section">
          <div class="section-head">
            <h2><svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>{{ 'discovery.trending.characters' | translate }}</h2>
            <a routerLink="/personajes">Ver mas en personajes</a>
          </div>
          @if (snapshot()!.trending.characters.length) {
            <div class="rail">
              @for (character of snapshot()!.trending.characters; track character.id) {
                <app-character-card [character]="character" />
              }
            </div>
          } @else {
            <p class="empty-section">No hay personajes destacados disponibles.</p>
          }
        </section>

        <section class="section">
          <div class="section-head">
            <h2><svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Comunidades populares</h2>
            <a routerLink="/comunidades/explorar">Ver mas en comunidades</a>
          </div>
          @if (popularCommunities().length) {
            <div class="rail">
              @for (c of popularCommunities(); track c.id) {
                <div class="rail-item">
                  <app-community-card [community]="c" />
                </div>
              }
            </div>
          } @else {
            <p class="empty-section">No hay comunidades disponibles.</p>
          }
        </section>

        <section class="section">
          <div class="section-head">
            <h2><svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>{{ 'discovery.community.title' | translate }}</h2>
            <a routerLink="/feed">Ver mas en feed</a>
          </div>
          @if (snapshot()!.community_posts.length) {
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
          } @else {
            <p class="empty-section">No hay publicaciones recientes disponibles.</p>
          }
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

      @media (max-width: 767px) {
        .discovery-page {
          scrollbar-width: none;
        }
        .discovery-page::-webkit-scrollbar {
          display: none;
        }
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

      .hero h1, .section-head h2 { margin: 0; }
      .section-head h2 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 500; }
      .section-icon { width: 22px; height: 22px; flex-shrink: 0; color: var(--accent-text); }

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

      @media (max-width: 767px) {
        .rail {
          scrollbar-width: none;
        }
        .rail::-webkit-scrollbar {
          display: none;
        }
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
        white-space: nowrap;
        margin-left: auto;
        flex-shrink: 0;
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

      .empty-section { text-align: center; color: var(--text-3); padding: 2rem 1rem; margin: 0; border: 1px solid var(--border); border-radius: 1.25rem; background: var(--bg-card); }

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
  private readonly communitiesService = inject(CommunityService);

  readonly snapshot = signal<DiscoverySnapshot | null>(null);
  readonly loading = signal(true);
  readonly genres = signal<Genre[]>([]);
  readonly popularCommunities = signal<Community[]>([]);
  readonly visibleGenres = computed(() => this.genres().slice(0, 4));

  constructor() {
    this.genresService.list().subscribe({
      next: (genres) => this.genres.set(genres),
      error: () => this.genres.set([]),
    });
    this.communitiesService.getCommunities({ limit: 6 }).subscribe({
      next: (res) => this.popularCommunities.set(res.data),
      error: () => this.popularCommunities.set([]),
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
