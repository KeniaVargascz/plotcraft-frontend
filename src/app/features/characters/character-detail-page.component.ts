import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CharactersService } from '../../core/services/characters.service';
import { KudosService } from '../../core/services/kudos.service';
import { AuthService } from '../../core/services/auth.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { CharacterDetail, CharacterRelationship } from '../../core/models/character.model';
@Component({
  selector: 'app-character-detail-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <p class="state">Cargando personaje...</p>
    } @else {
      @if (character(); as currentCharacter) {
        <section class="detail-shell">
          <header class="hero card">
            <div class="avatar">{{ currentCharacter.name.charAt(0) }}</div>
            <div class="hero-copy">
              <p class="eyebrow">{{ currentCharacter.role }} · {{ currentCharacter.status }}</p>
              <h1>{{ currentCharacter.name }}</h1>
              <p class="author">
                por
                <a [routerLink]="['/perfil', currentCharacter.author.username]"
                  >@{{ currentCharacter.author.username }}</a
                >
              </p>
              @if (currentCharacter.world) {
                <a class="world-link" [routerLink]="['/mundos', currentCharacter.world.slug]">
                  {{ currentCharacter.world.name }}
                </a>
              }
              <div class="kudo-row">
                @if (!currentCharacter.viewerContext?.isOwner) {
                  <button type="button" class="kudo-btn" [class.kudo-active]="currentCharacter.viewerContext?.hasKudo" [disabled]="kudoLoading()" (click)="toggleCharacterKudo()">
                    <span [class.kudo-beat]="kudoBeat()">&#9829;</span>
                    {{ currentCharacter.viewerContext?.hasKudo ? 'Kudo dado' : 'Dar kudo' }}
                  </button>
                }
                <span class="kudo-count">{{ currentCharacter.stats.kudosCount }} kudos</span>
              </div>
            </div>
          </header>

          <section class="content-grid">
            <article class="card prose">
              <div [innerHTML]="markdownService.render(detailMarkdown())"></div>
            </article>

            <aside class="card graph-card">
              <h2>Relaciones</h2>
              @if (!relationships().length) {
                <p class="state">Sin relaciones registradas.</p>
              } @else {
                <svg viewBox="0 0 300 300" class="graph">
                  @for (node of graphNodes(); track node.id) {
                    <line
                      [attr.x1]="150"
                      [attr.y1]="150"
                      [attr.x2]="node.x"
                      [attr.y2]="node.y"
                    ></line>
                  }
                  <circle cx="150" cy="150" r="32"></circle>
                  <text x="150" y="155" text-anchor="middle">{{ currentCharacter.name }}</text>
                  @for (node of graphNodes(); track node.id) {
                    <circle [attr.cx]="node.x" [attr.cy]="node.y" r="24"></circle>
                    <text [attr.x]="node.x" [attr.y]="node.y + 4" text-anchor="middle">
                      {{ node.label }}
                    </text>
                  }
                </svg>

                <div class="relation-list">
                  @for (relationship of relationships(); track relationship.id) {
                    <article>
                      <strong>{{ relationship.target.name }}</strong>
                      <small>{{ relationship.type }}</small>
                      <p>{{ relationship.description }}</p>
                    </article>
                  }
                </div>
              }
            </aside>
          </section>
        </section>
      } @else {
        <p class="state">No se pudo cargar el personaje.</p>
      }
    }
  `,
  styles: [
    `
      .detail-shell,
      .content-grid,
      .relation-list {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.25rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .hero {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 1rem;
      }
      .avatar {
        width: 120px;
        height: 120px;
        display: grid;
        place-items: center;
        border-radius: 1.25rem;
        background: linear-gradient(
          135deg,
          var(--accent-glow),
          color-mix(in srgb, var(--bg-card) 78%, white 22%)
        );
        color: var(--accent-text);
        font-size: 3rem;
        font-weight: 700;
      }
      .eyebrow,
      .author,
      .state,
      .relation-list small,
      .relation-list p {
        color: var(--text-2);
      }
      .content-grid {
        grid-template-columns: 1.05fr 0.95fr;
      }
      .graph {
        width: 100%;
        max-width: 360px;
        justify-self: center;
      }
      line,
      circle {
        stroke: var(--border);
        fill: color-mix(in srgb, var(--accent-glow) 72%, var(--bg-card));
      }
      text {
        fill: var(--text-1);
        font-size: 11px;
      }
      .kudo-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
      .kudo-btn { padding: 0.4rem 0.7rem; border-radius: 999px; background: var(--accent-glow); color: var(--text-2); border: 1px solid var(--border); cursor: pointer; font-size: 0.85rem; }
      .kudo-active { color: #e05555; border-color: #e05555; background: rgba(224,85,85,0.1); }
      .kudo-beat { display: inline-block; animation: beat 300ms ease-in-out; }
      .kudo-count { font-size: 0.85rem; color: var(--text-2); }
      @keyframes beat { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
      @media (max-width: 960px) {
        .hero,
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CharacterDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly charactersService = inject(CharactersService);
  private readonly kudosService = inject(KudosService);
  private readonly authService = inject(AuthService);
  readonly markdownService = inject(MarkdownService);

  readonly character = signal<CharacterDetail | null>(null);
  readonly relationships = signal<CharacterRelationship[]>([]);
  readonly loading = signal(true);
  readonly kudoLoading = signal(false);
  readonly kudoBeat = signal(false);
  readonly graphNodes = computed(() => {
    const items = this.relationships();
    return items.map((item, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(items.length, 1);
      return {
        id: item.id,
        label: item.target.name.slice(0, 8),
        x: 150 + 98 * Math.cos(angle),
        y: 150 + 98 * Math.sin(angle),
      };
    });
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const username = params.get('username');
      const slug = params.get('slug');
      if (!username || !slug) return;
      this.loading.set(true);
      this.charactersService.getBySlug(username, slug).subscribe({
        next: (character) => {
          this.character.set(character);
          this.charactersService.listRelationships(username, slug).subscribe({
            next: (relationships) => this.relationships.set(relationships),
            error: () => this.relationships.set([]),
          });
          this.loading.set(false);
        },
        error: () => {
          this.character.set(null);
          this.relationships.set([]);
          this.loading.set(false);
        },
      });
    });
  }

  toggleCharacterKudo() {
    const char = this.character();
    if (!char) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.kudoLoading.set(true);
    const action = char.viewerContext?.hasKudo
      ? this.kudosService.removeCharacterKudo(char.id)
      : this.kudosService.addCharacterKudo(char.id);

    action.subscribe({
      next: (response) => {
        this.character.set({
          ...char,
          stats: { ...char.stats, kudosCount: response.kudosCount },
          viewerContext: char.viewerContext ? { ...char.viewerContext, hasKudo: response.hasKudo } : null,
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

  detailMarkdown() {
    const current = this.character();
    if (!current) return '';

    return [
      current.personality && `## Personalidad\n${current.personality}`,
      current.motivations && `## Motivaciones\n${current.motivations}`,
      current.fears && `## Miedos\n${current.fears}`,
      current.strengths && `## Fortalezas\n${current.strengths}`,
      current.weaknesses && `## Debilidades\n${current.weaknesses}`,
      current.backstory && `## Backstory\n${current.backstory}`,
      current.arc && `## Arco\n${current.arc}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }
}
