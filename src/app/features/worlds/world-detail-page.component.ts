import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-world-detail-page',
  standalone: true,
  imports: [RouterLink, FormsModule, CharacterCardComponent, WbEntryCardComponent],
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
                <button type="button" class="kudo-btn" [class.kudo-active]="currentWorld.viewerContext?.hasKudo" [disabled]="kudoLoading()" (click)="toggleWorldKudo()">
                  <span [class.kudo-beat]="kudoBeat()">&#9829;</span>
                  {{ currentWorld.viewerContext?.hasKudo ? 'Kudo dado' : 'Dar kudo' }}
                </button>
              }
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
                <h3>Referencias visuales</h3>
                @if (visualRefs().length) {
                  <div class="visual-refs-grid">
                    @for (ref of visualRefs(); track ref.title + ref.imageUrl) {
                      <div class="visual-ref-card">
                        <img [src]="ref.imageUrl" [alt]="ref.title" class="ref-img" />
                        <span class="ref-title">{{ ref.title }}</span>
                        @if (currentWorld.viewerContext?.isOwner) {
                          <button type="button" class="ref-delete" (click)="removeVisualRef($index)">&times;</button>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <p class="ref-empty">Sin referencias visuales.</p>
                }

                @if (currentWorld.viewerContext?.isOwner) {
                  @if (showAddRef()) {
                    <div class="ref-form">
                      <input type="text" [(ngModel)]="newRefTitle" placeholder="Titulo de la referencia" class="ref-input" />
                      <input type="url" [(ngModel)]="newRefUrl" placeholder="URL de la imagen" class="ref-input" />
                      <div class="ref-form-actions">
                        <button type="button" class="ref-btn save" [disabled]="!newRefTitle.trim() || !newRefUrl.trim()" (click)="addVisualRef()">Guardar</button>
                        <button type="button" class="ref-btn cancel" (click)="showAddRef.set(false)">Cancelar</button>
                      </div>
                    </div>
                  } @else {
                    <button type="button" class="ref-add-btn" (click)="showAddRef.set(true)">+ Agregar referencia</button>
                  }
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
      .visual-refs-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .visual-ref-card {
        position: relative;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        overflow: hidden;
        background: var(--bg-surface);
      }
      .ref-img {
        width: 100%;
        height: 100px;
        object-fit: cover;
        display: block;
      }
      .ref-title {
        display: block;
        padding: 0.35rem 0.5rem;
        font-size: 0.75rem;
        color: var(--text-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ref-delete {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 1.4rem;
        height: 1.4rem;
        border: none;
        border-radius: 50%;
        background: rgba(0,0,0,0.6);
        color: #fff;
        cursor: pointer;
        font-size: 0.8rem;
        display: grid;
        place-items: center;
      }
      .ref-delete:hover { background: var(--danger); }
      .ref-empty { color: var(--text-3); font-size: 0.82rem; margin: 0; }
      .ref-form {
        display: grid;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }
      .ref-input {
        padding: 0.5rem 0.65rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.82rem;
      }
      .ref-input:focus { outline: 1px solid var(--accent); }
      .ref-form-actions { display: flex; gap: 0.5rem; }
      .ref-btn {
        padding: 0.4rem 0.85rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        font-size: 0.78rem;
        cursor: pointer;
      }
      .ref-btn.save { background: var(--accent); color: #fff; border-color: transparent; }
      .ref-btn.save:disabled { opacity: 0.5; cursor: not-allowed; }
      .ref-btn.cancel { background: var(--bg-surface); color: var(--text-2); }
      .ref-add-btn {
        display: block;
        width: 100%;
        padding: 0.5rem;
        border: 1px dashed var(--border);
        border-radius: 0.5rem;
        background: transparent;
        color: var(--text-3);
        font-size: 0.8rem;
        cursor: pointer;
        margin-top: 0.5rem;
      }
      .ref-add-btn:hover { border-color: var(--accent); color: var(--accent-text); }
      .kudo-btn { padding: 0.4rem 0.7rem; border-radius: 999px; background: var(--accent-glow); color: var(--text-2); border: 1px solid var(--border); cursor: pointer; font-size: 0.85rem; }
      .kudo-active { color: #e05555; border-color: #e05555; background: rgba(224,85,85,0.1); }
      .kudo-beat { display: inline-block; animation: beat 300ms ease-in-out; }
      .kudo-count { font-size: 0.85rem; color: var(--text-2); }
      @keyframes beat { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
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
  readonly showAddRef = signal(false);
  newRefTitle = '';
  newRefUrl = '';
  readonly visualRefs = computed(() => {
    const w = this.world();
    const refs = (w?.metadata as any)?.visualRefs;
    return Array.isArray(refs) ? refs as { title: string; imageUrl: string }[] : [];
  });

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
                this.wbService.listCategoryEntries(slug, cat.slug, { limit: 4, ...(!isOwner ? { isPublic: true } : {}) }).subscribe({
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

  addVisualRef() {
    if (!this.newRefTitle.trim() || !this.newRefUrl.trim()) return;
    const w = this.world();
    if (!w) return;
    const current = this.visualRefs();
    const updated = [...current, { title: this.newRefTitle.trim(), imageUrl: this.newRefUrl.trim() }];
    const metadata = { ...(w.metadata as any || {}), visualRefs: updated };
    this.worldsService.update(w.slug, { metadata }).subscribe({
      next: (updatedWorld) => {
        this.world.set(updatedWorld);
        this.newRefTitle = '';
        this.newRefUrl = '';
        this.showAddRef.set(false);
      },
    });
  }

  removeVisualRef(index: number) {
    const w = this.world();
    if (!w) return;
    const current = [...this.visualRefs()];
    current.splice(index, 1);
    const metadata = { ...(w.metadata as any || {}), visualRefs: current };
    this.worldsService.update(w.slug, { metadata }).subscribe({
      next: (updatedWorld) => this.world.set(updatedWorld),
    });
  }
}
