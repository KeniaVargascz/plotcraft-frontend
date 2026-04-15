import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarkdownService } from '../../core/services/markdown.service';
import { WorldsService } from '../../core/services/worlds.service';
import { WorldbuildingService } from '../../core/services/worldbuilding.service';
import { KudosService } from '../../core/services/kudos.service';
import { AuthService } from '../../core/services/auth.service';
import { WorldDetail, WORLD_GENRE_LABELS } from '../../core/models/world.model';
import { WbCategorySummary } from '../../core/models/wb-category.model';
import { WbEntrySummary } from '../../core/models/wb-entry.model';
import { CharacterCardComponent } from '../characters/components/character-card.component';
import { CharactersService } from '../../core/services/characters.service';
import { CharacterSummary } from '../../core/models/character.model';
import { WbEntryCardComponent } from './worldbuilding/components/wb-entry-card.component';
import { LinkedVisualBoardsSectionComponent } from '../visual-boards/components/linked-visual-boards-section.component';

@Component({
  selector: 'app-world-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    CharacterCardComponent,
    WbEntryCardComponent,
    LinkedVisualBoardsSectionComponent,
  ],
  template: `
    @if (loading()) {
      <p class="state">Cargando mundo...</p>
    } @else {
      @if (world(); as currentWorld) {
        <section class="detail-shell">
          <header class="hero card">
            <div>
              <p class="eyebrow">Mundo</p>
              <h1>{{ currentWorld.name }}</h1>
              @if (currentWorld.genre) {
                <span class="genre-pill">{{ genreLabel(currentWorld.genre) }}</span>
              }
              <p class="tagline">{{ currentWorld.tagline }}</p>
              <p class="author">
                por
                <a [routerLink]="['/perfil', currentWorld.author.username]"
                  >@{{ currentWorld.author.username }}</a
                >
              </p>
            </div>
            <div class="stats">
              <span>{{ currentWorld.stats.charactersCount }} personajes</span>
              <span>{{ currentWorld.stats.locationsCount }} lugares</span>
              <span>{{ currentWorld.stats.novelsCount }} novelas</span>
              <span class="kudo-count">{{ currentWorld.stats.kudosCount }} kudos</span>
              @if (!currentWorld.viewerContext?.isOwner) {
                <button
                  type="button"
                  class="kudo-btn"
                  [class.kudo-active]="currentWorld.viewerContext?.hasKudo"
                  [disabled]="kudoLoading()"
                  (click)="toggleWorldKudo()"
                >
                  <span [class.kudo-beat]="kudoBeat()">&#9829;</span>
                  {{ currentWorld.viewerContext?.hasKudo ? 'Kudo dado' : 'Dar kudo' }}
                </button>
              }
            </div>
          </header>

          <section class="content-grid">
            <article class="card prose">
              <div [innerHTML]="markdownService.render(worldMarkdown(currentWorld))"></div>
            </article>

            <aside class="side-column">
              @if (currentWorld.linkedNovels.length) {
                <section class="card">
                  <h3>Novelas vinculadas</h3>
                  @for (novel of currentWorld.linkedNovels; track novel.id) {
                    <a class="simple-link" [routerLink]="['/novelas', novel.slug]">{{
                      novel.title
                    }}</a>
                  }
                </section>
              }
            </aside>
          </section>

          @if (loreCategories().length) {
            <section class="related lore-section">
              <div class="section-head">
                <h2>Lore</h2>
                <a class="section-cta" [routerLink]="['/mundos', currentWorld.slug, 'lore']">
                  <span>Ver todo el lore</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
              @for (loreCat of loreCategories(); track loreCat.slug) {
                @if (loreEntries()[loreCat.slug]?.length) {
                  <div class="lore-cat-group">
                    <h3 class="lore-cat-title">{{ loreCat.icon || '' }} {{ loreCat.name }}</h3>
                    <div class="lore-scroll">
                      @for (entry of loreEntries()[loreCat.slug]; track entry.id) {
                        <a
                          [routerLink]="['/mundos', currentWorld.slug, 'lore', entry.slug]"
                          class="lore-entry-link"
                        >
                          <app-wb-entry-card [entry]="entry" />
                        </a>
                      }
                    </div>
                  </div>
                }
              }
            </section>
          }

          @if (characters().length) {
            <section class="related">
              <div class="section-head">
                <h2>Personajes del mundo</h2>
                <a class="section-cta" [routerLink]="['/personajes']">
                  <span>Ver todos</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
              <div class="character-grid">
                @for (character of characters(); track character.id) {
                  <app-character-card [character]="character" />
                }
              </div>
            </section>
          }

          <app-linked-visual-boards-section
            [linkedType]="'world'"
            [linkedId]="currentWorld.id"
            [authorUsername]="currentWorld.author.username"
            [entityLabel]="'mundo'"
            [isOwner]="currentWorld.viewerContext?.isOwner ?? false"
          />
        </section>
      } @else {
        <p class="state">No se pudo cargar el mundo.</p>
      }
    }
  `,
  styles: [
    `
      .detail-shell,
      .content-grid,
      .side-column,
      .related {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.25rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .hero,
      .section-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: center;
      }
      .hero {
        align-items: flex-start;
      }
      .section-head h2 {
        margin: 0;
      }
      .eyebrow,
      .tagline,
      .author,
      .stats,
      .location-item small,
      .location-item p,
      .state {
        color: var(--text-2);
      }
      .genre-pill {
        display: inline-block;
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.8rem;
        font-weight: 600;
        margin-top: 0.25rem;
        width: fit-content;
      }
      .content-grid {
        grid-template-columns: 1.15fr 0.85fr;
      }
      .stats {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: flex-start;
        align-items: flex-start;
        align-self: flex-start;
        max-width: min(100%, 24rem);
      }
      .stats span {
        display: inline-flex;
        align-items: center;
        padding: 0.55rem 0.8rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        white-space: nowrap;
      }
      .kudo-btn {
        padding: 0.4rem 0.7rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--text-2);
        border: 1px solid var(--border);
        cursor: pointer;
        font-size: 0.85rem;
      }
      .kudo-active {
        color: #e05555;
        border-color: #e05555;
        background: rgba(224, 85, 85, 0.1);
      }
      .kudo-beat {
        display: inline-block;
        animation: beat 300ms ease-in-out;
      }
      .kudo-count {
        font-size: 0.85rem;
        color: var(--text-2);
      }
      @keyframes beat {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.3);
        }
        100% {
          transform: scale(1);
        }
      }
      .simple-link {
        display: block;
        padding: 0.6rem 0;
        color: var(--text-1);
        text-decoration: none;
      }
      .section-cta {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.7rem 1rem;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--accent-strong, var(--accent)) 35%, var(--border));
        background:
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent-glow) 78%, transparent),
            color-mix(in srgb, var(--bg-card) 88%, transparent)
          );
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        color: var(--accent-text);
        font-size: 0.92rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        text-decoration: none;
        transition:
          transform 180ms ease,
          box-shadow 180ms ease,
          border-color 180ms ease,
          background 180ms ease;
      }
      .section-cta:hover,
      .section-cta:focus-visible {
        transform: translateY(-1px);
        border-color: color-mix(in srgb, var(--accent-strong, var(--accent)) 58%, var(--border));
        box-shadow: 0 14px 28px rgba(15, 23, 42, 0.14);
        outline: none;
      }
      .section-cta span:last-child {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.35rem;
        height: 1.35rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--accent) 16%, transparent);
        font-size: 0.9rem;
        transition: transform 180ms ease;
      }
      .section-cta:hover span:last-child,
      .section-cta:focus-visible span:last-child {
        transform: translateX(2px);
      }
      .character-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .lore-section {
        gap: 0.75rem;
      }
      .lore-cat-group {
        display: grid;
        gap: 0.5rem;
      }
      .lore-cat-title {
        margin: 0;
        font-size: 0.95rem;
        color: var(--text-2);
      }
      .lore-scroll {
        display: flex;
        gap: 1rem;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        scroll-snap-type: x mandatory;
      }
      .lore-entry-link {
        flex: 0 0 15rem;
        scroll-snap-align: start;
        text-decoration: none;
        display: block;
      }
      @media (max-width: 960px) {
        .content-grid,
        .character-grid {
          grid-template-columns: 1fr;
        }
        .section-cta {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class WorldDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly worldsService = inject(WorldsService);
  private readonly charactersService = inject(CharactersService);
  private readonly wbService = inject(WorldbuildingService);
  private readonly kudosService = inject(KudosService);
  private readonly authService = inject(AuthService);
  readonly markdownService = inject(MarkdownService);

  readonly world = signal<WorldDetail | null>(null);
  readonly kudoLoading = signal(false);
  readonly kudoBeat = signal(false);
  readonly characters = signal<CharacterSummary[]>([]);
  readonly loreCategories = signal<WbCategorySummary[]>([]);
  readonly loreEntries = signal<Record<string, WbEntrySummary[]>>({});
  readonly loading = signal(true);
  readonly genreLabels = WORLD_GENRE_LABELS;

  genreLabel(genre: string): string {
    return this.genreLabels[genre as keyof typeof WORLD_GENRE_LABELS] ?? genre;
  }

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.loading.set(true);
      this.worldsService.getBySlug(slug).subscribe({
        next: (world) => {
          this.world.set(world);
          this.charactersService.listByWorld(slug, { limit: 8 }).subscribe({
            next: (response) => this.characters.set(response.data),
            error: () => this.characters.set([]),
          });
          this.wbService.listCategories(slug).subscribe({
            next: (cats) => {
              this.loreCategories.set(cats);
              const isOwner = world.viewerContext?.isOwner;
              for (const cat of cats) {
                this.wbService
                  .listCategoryEntries(slug, cat.slug, {
                    limit: 4,
                    ...(!isOwner ? { isPublic: true } : {}),
                  })
                  .subscribe({
                    next: (res) => {
                      this.loreEntries.update((current) => ({ ...current, [cat.slug]: res.data }));
                    },
                    error: () => {
                      this.loreEntries.update((current) => ({ ...current, [cat.slug]: [] }));
                    },
                  });
              }
            },
            error: () => this.loreCategories.set([]),
          });
          this.loading.set(false);
        },
        error: () => {
          this.world.set(null);
          this.characters.set([]);
          this.loading.set(false);
        },
      });
    });
  }

  toggleWorldKudo() {
    const w = this.world();
    if (!w) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.kudoLoading.set(true);
    const action = w.viewerContext?.hasKudo
      ? this.kudosService.removeWorldKudo(w.id)
      : this.kudosService.addWorldKudo(w.id);

    action.subscribe({
      next: (response) => {
        this.world.set({
          ...w,
          stats: { ...w.stats, kudosCount: response.kudosCount },
          viewerContext: w.viewerContext ? { ...w.viewerContext, hasKudo: response.hasKudo } : null,
        });
        if (response.hasKudo) {
          this.kudoBeat.set(true);
          setTimeout(() => this.kudoBeat.set(false), 300);
        }
        this.kudoLoading.set(false);
      },
      error: () => this.kudoLoading.set(false),
    });
  }

  worldMarkdown(world: WorldDetail) {
    const hasLegacyStructure =
      Boolean(world.setting) || Boolean(world.magicSystem) || Boolean(world.rules);

    if (!hasLegacyStructure && world.description) {
      return world.description;
    }

    return (
      [
        world.description && `## Descripcion\n${world.description}`,
        world.setting && `## Ambientacion\n${world.setting}`,
        world.magicSystem && `## Sistema de magia\n${world.magicSystem}`,
        world.rules && `## Reglas\n${world.rules}`,
      ]
        .filter(Boolean)
        .join('\n\n') || 'Sin descripcion todavia.'
    );
  }
}
