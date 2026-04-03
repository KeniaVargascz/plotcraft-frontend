import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkdownService } from '../../core/services/markdown.service';
import { WorldsService } from '../../core/services/worlds.service';
import { WorldbuildingService } from '../../core/services/worldbuilding.service';
import { WorldDetail, WORLD_GENRE_LABELS } from '../../core/models/world.model';
import { WbCategorySummary } from '../../core/models/wb-category.model';
import { WbEntrySummary } from '../../core/models/wb-entry.model';
import { CharacterCardComponent } from '../characters/components/character-card.component';
import { CharactersService } from '../../core/services/characters.service';
import { CharacterSummary } from '../../core/models/character.model';
import { WbEntryCardComponent } from './worldbuilding/components/wb-entry-card.component';

@Component({
  selector: 'app-world-detail-page',
  standalone: true,
  imports: [RouterLink, CharacterCardComponent, WbEntryCardComponent],
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
            </div>
          </header>

          <section class="content-grid">
            <article class="card prose">
              <h2>Descripcion</h2>
              <div
                [innerHTML]="
                  markdownService.render(currentWorld.description || 'Sin descripcion todavia.')
                "
              ></div>
              <h3>Ambientacion</h3>
              <div
                [innerHTML]="
                  markdownService.render(currentWorld.setting || 'Sin ambientacion registrada.')
                "
              ></div>
              <h3>Sistema y reglas</h3>
              <div
                [innerHTML]="
                  markdownService.render(
                    (currentWorld.magicSystem || '') +
                      '

' +
                      (currentWorld.rules || '')
                  )
                "
              ></div>
            </article>

            <aside class="side-column">
              <section class="card">
                <h3>Lugares</h3>
                @for (location of currentWorld.locations; track location.id) {
                  <article class="location-item">
                    <strong>{{ location.name }}</strong>
                    <small>{{ location.type }}</small>
                    <p>{{ location.description }}</p>
                  </article>
                }
              </section>

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
                <a [routerLink]="['/mundos', currentWorld.slug, 'lore']">Ver todo el lore</a>
              </div>
              @for (loreCat of loreCategories(); track loreCat.slug) {
                @if (loreEntries()[loreCat.slug]?.length) {
                  <div class="lore-cat-group">
                    <h3 class="lore-cat-title">{{ loreCat.icon || '' }} {{ loreCat.name }}</h3>
                    <div class="lore-scroll">
                      @for (entry of loreEntries()[loreCat.slug]; track entry.id) {
                        <a [routerLink]="['/mundos', currentWorld.slug, 'lore', entry.slug]" class="lore-entry-link">
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
                <a [routerLink]="['/personajes']">Ver todos</a>
              </div>
              <div class="character-grid">
                @for (character of characters(); track character.id) {
                  <app-character-card [character]="character" />
                }
              </div>
            </section>
          }
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
      }
      .hero {
        align-items: flex-start;
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
      .location-item {
        display: grid;
        gap: 0.25rem;
        padding: 0.8rem 0;
        border-bottom: 1px solid var(--border);
      }
      .simple-link {
        display: block;
        padding: 0.6rem 0;
        color: var(--text-1);
        text-decoration: none;
      }
      .character-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .lore-section { gap: 0.75rem; }
      .lore-cat-group { display: grid; gap: 0.5rem; }
      .lore-cat-title { margin: 0; font-size: 0.95rem; color: var(--text-2); }
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
      }
    `,
  ],
})
export class WorldDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly worldsService = inject(WorldsService);
  private readonly charactersService = inject(CharactersService);
  private readonly wbService = inject(WorldbuildingService);
  readonly markdownService = inject(MarkdownService);

  readonly world = signal<WorldDetail | null>(null);
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
              for (const cat of cats) {
                this.wbService.listCategoryEntries(slug, cat.slug, { limit: 4, isPublic: true }).subscribe({
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
}
