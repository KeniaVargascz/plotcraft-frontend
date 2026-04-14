import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CharactersService } from '../../core/services/characters.service';
import { KudosService } from '../../core/services/kudos.service';
import { AuthService } from '../../core/services/auth.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { CharacterDetail, CharacterRelationship } from '../../core/models/character.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LinkedVisualBoardsSectionComponent } from '../visual-boards/components/linked-visual-boards-section.component';
import { CharacterKinshipDialogComponent } from './components/character-kinship-dialog.component';

@Component({
  selector: 'app-character-detail-page',
  standalone: true,
  imports: [RouterLink, LinkedVisualBoardsSectionComponent],
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
                <a [routerLink]="['/perfil', currentCharacter.author.username]">
                  @{{ currentCharacter.author.username }}
                </a>
              </p>
              @if (currentCharacter.world) {
                <a class="world-link" [routerLink]="['/mundos', currentCharacter.world.slug]">
                  {{ currentCharacter.world.name }}
                </a>
              }
              <div class="kudo-row">
                @if (!currentCharacter.viewerContext?.isOwner) {
                  <button
                    type="button"
                    class="kudo-btn"
                    [class.kudo-active]="currentCharacter.viewerContext?.hasKudo"
                    [disabled]="kudoLoading()"
                    (click)="toggleCharacterKudo()"
                  >
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
              <div class="section-header">
                <div>
                  <h2>Relaciones familiares</h2>
                  <p class="section-copy">Parentescos registrados y personajes conectados.</p>
                </div>
                @if (currentCharacter.viewerContext?.isOwner) {
                  <button type="button" class="primary" (click)="openKinshipDialog()">
                    Agregar parentesco
                  </button>
                }
              </div>

              @if (relationshipLoading()) {
                <p class="state">Cargando parentescos...</p>
              } @else if (!relationships().length) {
                <p class="state">Sin parentescos registrados.</p>
              } @else {
                <svg viewBox="0 0 300 300" class="graph" aria-label="Diagrama de relaciones">
                  @for (node of graphNodes(); track node.id) {
                    <line
                      [attr.x1]="150"
                      [attr.y1]="150"
                      [attr.x2]="node.x"
                      [attr.y2]="node.y"
                    ></line>
                  }
                  <circle cx="150" cy="150" r="32" class="graph-center"></circle>
                  <text x="150" y="155" text-anchor="middle" class="graph-text-center">
                    {{ currentCharacter.name }}
                  </text>

                  @for (node of graphNodes(); track node.id) {
                    <g class="graph-node" (click)="goToRelationship(node.relationship)">
                      <circle [attr.cx]="node.x" [attr.cy]="node.y" r="24"></circle>
                      <text [attr.x]="node.x" [attr.y]="node.y + 4" text-anchor="middle">
                        {{ node.label }}
                      </text>
                    </g>
                    <text
                      [attr.x]="node.x"
                      [attr.y]="node.y + 36"
                      text-anchor="middle"
                      class="graph-relation-label"
                    >
                      {{ node.relationship.label }}
                    </text>
                  }
                </svg>

                <div class="relation-list">
                  @for (relationship of relationships(); track relationship.id) {
                    <article class="relation-card">
                      <div class="relation-main">
                        <small class="relation-type">{{ relationship.label }}</small>
                        <a
                          class="relation-target"
                          [routerLink]="[
                            '/personajes',
                            relationship.target.username,
                            relationship.target.slug,
                          ]"
                        >
                          {{ relationship.target.name }}
                        </a>
                        @if (relationship.target.world) {
                          <a
                            class="relation-world"
                            [routerLink]="['/mundos', relationship.target.world.slug]"
                          >
                            {{ relationship.target.world.name }}
                          </a>
                        }
                        @if (relationship.description) {
                          <p>{{ relationship.description }}</p>
                        }
                      </div>
                      @if (currentCharacter.viewerContext?.isOwner) {
                        <button
                          type="button"
                          class="ghost danger"
                          (click)="removeRelationship(relationship)"
                        >
                          Eliminar
                        </button>
                      }
                    </article>
                  }
                </div>
                  @if (hasMoreRelationships()) {
                    <button
                      type="button"
                      class="load-more"
                      [disabled]="relationshipLoading()"
                      (click)="loadMoreRelationships()"
                    >
                      {{ relationshipLoading() ? 'Cargando...' : 'Cargar mas' }}
                    </button>
                  }
              }
            </aside>
          </section>

          <app-linked-visual-boards-section
            [linkedType]="'character'"
            [linkedId]="currentCharacter.id"
            [authorUsername]="currentCharacter.author.username"
            [entityLabel]="'personaje'"
            [isOwner]="currentCharacter.viewerContext?.isOwner ?? false"
          />
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
      .section-copy,
      .relation-type,
      .relation-world,
      .relation-card p {
        color: var(--text-2);
      }
      .content-grid {
        grid-template-columns: 1.05fr 0.95fr;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
        margin-bottom: 1rem;
      }
      .section-header h2 {
        margin: 0;
      }
      .section-copy {
        margin: 0.35rem 0 0;
      }
      .primary,
      .ghost,
      .kudo-btn {
        padding: 0.55rem 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
      }
      .primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      .ghost.danger {
        color: #d16e6e;
      }
      .graph {
        width: 100%;
        max-width: 360px;
        justify-self: center;
        overflow: visible;
      }
      line,
      .graph-node circle,
      .graph-center {
        stroke: var(--border);
        fill: color-mix(in srgb, var(--accent-glow) 72%, var(--bg-card));
      }
      .graph-node {
        cursor: pointer;
      }
      .graph-node:hover circle {
        fill: color-mix(in srgb, var(--accent-glow) 84%, white 16%);
      }
      text {
        fill: var(--text-1);
        font-size: 11px;
      }
      .graph-text-center {
        font-weight: 700;
      }
      .graph-relation-label {
        font-size: 10px;
        fill: var(--text-2);
      }
      .relation-list {
        margin-top: 0.5rem;
      }
      .relation-card {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
        padding: 0.95rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .relation-main {
        display: grid;
        gap: 0.25rem;
      }
      .relation-type {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .relation-target {
        color: var(--text-1);
        font-size: 1.05rem;
        font-weight: 700;
        text-decoration: none;
      }
      .relation-target:hover,
      .relation-world:hover {
        text-decoration: underline;
      }
      .relation-card p {
        margin: 0.25rem 0 0;
      }
      .kudo-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .kudo-btn {
        background: var(--accent-glow);
        color: var(--text-2);
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
      @media (max-width: 960px) {
        .hero,
        .content-grid,
        .relation-card {
          grid-template-columns: 1fr;
        }
        .relation-card {
          display: grid;
        }
      }
      @media (max-width: 720px) {
        .section-header {
          flex-direction: column;
        }
      }
      .load-more {
        margin-top: 0.5rem;
        justify-self: center;
        padding: 0.65rem 1.5rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
      }
      .load-more:hover:not(:disabled) {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .load-more:disabled {
        opacity: 0.6;
      }
    `,
  ],
})
export class CharacterDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly charactersService = inject(CharactersService);
  private readonly kudosService = inject(KudosService);
  private readonly authService = inject(AuthService);
  readonly markdownService = inject(MarkdownService);

  readonly character = signal<CharacterDetail | null>(null);
  readonly relationships = signal<CharacterRelationship[]>([]);
  readonly loading = signal(true);
  readonly kudoLoading = signal(false);
  readonly relationshipLoading = signal(false);
  readonly hasMoreRelationships = signal(false);
  readonly kudoBeat = signal(false);
  readonly graphNodes = computed(() => {
    const items = this.relationships();
    return items.map((relationship, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(items.length, 1);
      return {
        id: relationship.id,
        relationship,
        label: relationship.target.name.slice(0, 8),
        x: 150 + 98 * Math.cos(angle),
        y: 150 + 98 * Math.sin(angle),
      };
    });
  });

  private currentUsername = '';
  private currentSlug = '';
  private relationshipsCursor: string | null = null;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const username = params.get('username');
      const slug = params.get('slug');
      if (!username || !slug) return;

      this.currentUsername = username;
      this.currentSlug = slug;
      this.loadCharacter(username, slug);
    });
  }

  toggleCharacterKudo() {
    const char = this.character();
    if (!char) return;

    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
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
          viewerContext: char.viewerContext
            ? { ...char.viewerContext, hasKudo: response.hasKudo }
            : null,
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

  openKinshipDialog() {
    const char = this.character();
    if (!char || !char.viewerContext?.isOwner) return;

    const ref = this.dialog.open(CharacterKinshipDialogComponent, {
      data: {
        currentCharacterId: char.id,
        username: char.author.username,
        slug: char.slug,
      },
      width: 'min(40rem, 96vw)',
      maxWidth: '96vw',
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created: CharacterRelationship | null) => {
        if (!created) return;
        this.refreshRelationships();
      });
  }

  removeRelationship(relationship: CharacterRelationship) {
    const char = this.character();
    if (!char?.viewerContext?.isOwner) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar parentesco',
        description: `¿Seguro que deseas eliminar la relación con "${relationship.target.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed !== true) return;
        this.relationshipLoading.set(true);
        this.charactersService
          .removeRelationship(char.author.username, char.slug, relationship.id)
          .subscribe({
            next: () => {
              this.relationshipLoading.set(false);
              this.refreshRelationships();
            },
            error: () => this.relationshipLoading.set(false),
          });
      });
  }

  goToRelationship(relationship: CharacterRelationship) {
    void this.router.navigate([
      '/personajes',
      relationship.target.username,
      relationship.target.slug,
    ]);
  }

  detailMarkdown() {
    const current = this.character();
    if (!current) return '';

    const legacySections = [
      current.personality && `## Personalidad\n${current.personality}`,
      current.motivations && `## Motivaciones\n${current.motivations}`,
      current.fears && `## Miedos\n${current.fears}`,
      current.strengths && `## Fortalezas\n${current.strengths}`,
      current.weaknesses && `## Debilidades\n${current.weaknesses}`,
      current.backstory && `## Backstory\n${current.backstory}`,
      current.arc && `## Arco\n${current.arc}`,
    ].filter(Boolean);

    const hasLegacyStructure =
      Boolean(current.personality) ||
      Boolean(current.motivations) ||
      Boolean(current.fears) ||
      Boolean(current.strengths) ||
      Boolean(current.weaknesses) ||
      Boolean(current.arc);

    if (!hasLegacyStructure && current.backstory) {
      return current.backstory;
    }

    return legacySections.join('\n\n');
  }

  private loadCharacter(username: string, slug: string) {
    this.loading.set(true);
    this.charactersService.getBySlug(username, slug).subscribe({
      next: (character) => {
        this.character.set(character);
        this.refreshRelationships();
        this.loading.set(false);
      },
      error: () => {
        this.character.set(null);
        this.relationships.set([]);
        this.loading.set(false);
      },
    });
  }

  loadMoreRelationships() {
    this.fetchRelationships(false);
  }

  private refreshRelationships() {
    this.relationshipsCursor = null;
    this.fetchRelationships(true);
  }

  private fetchRelationships(reset: boolean) {
    if (!this.currentUsername || !this.currentSlug) return;

    this.relationshipLoading.set(true);
    this.charactersService
      .listRelationships(this.currentUsername, this.currentSlug, {
        cursor: reset ? null : this.relationshipsCursor,
        limit: 20,
      })
      .subscribe({
        next: (res) => {
          this.relationships.update((list) => (reset ? res.data : [...list, ...res.data]));
          this.relationshipsCursor = res.pagination.nextCursor;
          this.hasMoreRelationships.set(res.pagination.hasMore);
          this.relationshipLoading.set(false);
        },
        error: () => {
          if (reset) this.relationships.set([]);
          this.relationshipLoading.set(false);
        },
      });
  }
}
