import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorldSummary, WORLD_GENRE_LABELS } from '../../../core/models/world.model';
import { AuthGateService } from '../../../core/services/auth-gate.service';

@Component({
  selector: 'app-world-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="world-card">
      <a class="cover" [class]="world().coverUrl ? '' : coverClass()" (click)="onDetailClick()">
        @if (world().coverUrl) {
          <img [src]="world().coverUrl" [alt]="world().name" class="cover-img" loading="lazy" />
        } @else {
          <span class="cover-lines"></span>
          <span class="cover-pattern" [innerHTML]="patternSvg()"></span>
          <span class="cover-initial">{{ world().name.charAt(0) }}</span>
        }
        <span class="type-badge">{{ coverBadge() }}</span>
      </a>

      <div class="body">
        <div class="eyebrow-row">
          <a class="author-link" [routerLink]="['/perfil', world().author.username]">
            @{{ world().author.username }}
          </a>
          @if (showVisibility()) {
            <span class="visibility-badge">
              {{ world().visibility === 'PUBLIC' ? 'Publico' : 'Privado' }}
            </span>
          }
        </div>

        @if (genreLabel()) {
          <span class="genre-badge">{{ genreLabel() }}</span>
        }
        <a class="title" (click)="onDetailClick()">{{ world().name }}</a>
        <p class="description">
          {{ world().tagline || world().description || 'Sin descripcion todavia.' }}
        </p>

        @if (visibleTags().length) {
          <div class="tags-row">
            @for (tag of visibleTags(); track tag) {
              <span class="tag-pill">{{ tag }}</span>
            }
          </div>
        }
      </div>

      <footer class="footer">
        <span class="stat">
          <span class="stat-icon stat-icon-characters"></span>
          <span class="stat-value">{{ world().stats.charactersCount }}</span>
          <span class="stat-label">personajes</span>
        </span>
        <span class="divider"></span>
        <span class="stat">
          <span class="stat-icon stat-icon-locations"></span>
          <span class="stat-value">{{ world().stats.locationsCount }}</span>
          <span class="stat-label">lugares</span>
        </span>
        <span class="divider"></span>
        <span class="stat">
          <span class="stat-icon stat-icon-novels"></span>
          <span class="stat-value">{{ world().stats.novelsCount }}</span>
          <span class="stat-label">novelas</span>
        </span>
      </footer>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .world-card {
        display: grid;
        grid-template-rows: auto 1fr auto;
        height: 100%;
        border-radius: 1.3rem;
        overflow: hidden;
        border: 1px solid var(--border);
        background: var(--bg-card);
        box-shadow: 0 22px 42px var(--shadow);
      }

      .cover {
        position: relative;
        height: 8.1rem;
        overflow: hidden;
        display: grid;
        place-items: center;
        text-decoration: none;
        cursor: pointer;
      }

      .cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .cover-tone-0,
      .cover-tone-1,
      .cover-tone-2,
      .cover-tone-3 {
        background: var(--bg-elevated);
      }

      .cover-lines {
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(
          0deg,
          currentColor 0,
          currentColor 1px,
          transparent 1px,
          transparent 18px
        );
        opacity: 0.04;
      }

      .cover-tone-0 .cover-lines,
      .cover-tone-1 .cover-lines,
      .cover-tone-2 .cover-lines,
      .cover-tone-3 .cover-lines {
        color: var(--accent-text);
      }

      .cover-pattern {
        position: absolute;
        inset: 0;
        opacity: 0.09;
      }

      .cover-pattern :global(svg) {
        width: 100%;
        height: 100%;
      }

      .cover-initial {
        position: relative;
        z-index: 1;
        font:
          italic 400 3.2rem/1 'Playfair Display',
          serif;
      }

      .cover-tone-0 .cover-initial,
      .cover-tone-1 .cover-initial,
      .cover-tone-2 .cover-initial,
      .cover-tone-3 .cover-initial {
        color: var(--accent-text);
      }

      .type-badge {
        position: absolute;
        top: 0.7rem;
        right: 0.7rem;
        z-index: 2;
        padding: 0.22rem 0.55rem;
        border-radius: 0.4rem;
        border: 1px solid var(--border);
        background: var(--bg-base);
        color: var(--text-2);
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .body {
        display: grid;
        gap: 0.45rem;
        padding: 0.9rem 1rem 0;
      }

      .eyebrow-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem;
      }

      .author-link,
      .title {
        text-decoration: none;
      }

      .author-link {
        color: var(--accent-text);
        font-size: 0.72rem;
      }

      .visibility-badge {
        padding: 0.18rem 0.52rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--accent-glow) 64%, transparent);
        color: var(--accent-text);
        font-size: 0.7rem;
        font-weight: 600;
      }

      .genre-badge {
        display: inline-block;
        padding: 0.18rem 0.55rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--accent-glow) 48%, transparent);
        color: var(--accent-text);
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        width: fit-content;
      }

      .title {
        color: var(--text-1);
        cursor: pointer;
        font:
          400 1.1rem/1.25 'Playfair Display',
          serif;
      }

      .description {
        margin: 0;
        color: var(--text-2);
        font-size: 0.8rem;
        line-height: 1.55;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: calc(1.55em * 2);
      }

      .tags-row {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        margin-top: 0.2rem;
      }

      .tag-pill {
        padding: 0.22rem 0.58rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
        color: var(--text-2);
        font-size: 0.7rem;
        white-space: nowrap;
      }

      .footer {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.9rem 1rem 1rem;
        margin-top: 0.9rem;
        border-top: 1px solid var(--border);
        flex-wrap: wrap;
      }

      .stat {
        display: inline-flex;
        align-items: center;
        gap: 0.32rem;
        font-size: 0.72rem;
        color: var(--text-2);
      }

      .stat-value {
        color: var(--text-1);
        font-weight: 700;
      }

      .stat-label {
        color: var(--text-3);
      }

      .divider {
        width: 1px;
        height: 0.8rem;
        background: var(--border);
      }

      .stat-icon {
        width: 0.82rem;
        height: 0.82rem;
        border-radius: 0.24rem;
        opacity: 0.5;
      }

      .stat-icon-characters {
        background:
          radial-gradient(circle at 50% 30%, currentColor 0 22%, transparent 24%),
          linear-gradient(currentColor, currentColor) center 78% / 70% 2px no-repeat;
        color: var(--text-3);
      }

      .stat-icon-locations {
        background:
          linear-gradient(currentColor, currentColor) center 70% / 72% 2px no-repeat,
          linear-gradient(135deg, transparent 50%, currentColor 50%) center 34% / 56% 56% no-repeat;
        color: var(--text-3);
      }

      .stat-icon-novels {
        background:
          linear-gradient(currentColor, currentColor) center 28% / 72% 2px no-repeat,
          linear-gradient(currentColor, currentColor) center 52% / 72% 2px no-repeat,
          linear-gradient(currentColor, currentColor) center 76% / 56% 2px no-repeat;
        color: var(--text-3);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldCardComponent {
  private readonly authGate = inject(AuthGateService);
  readonly world = input.required<WorldSummary>();
  readonly showVisibility = input(false);

  readonly genreLabel = computed(() => {
    const genre = this.world().genre;
    return genre ? WORLD_GENRE_LABELS[genre] : null;
  });
  readonly visibleTags = computed(() => this.world().tags.slice(0, 3));
  readonly toneIndex = computed(() => {
    const slug = this.world().slug;
    return [...slug].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 4;
  });

  onDetailClick(): void {
    this.authGate.navigate(['/mundos', this.world().slug]);
  }

  coverClass() {
    return `cover-tone-${this.toneIndex()}`;
  }

  coverBadge() {
    return this.world().tags[0] || 'Mundo';
  }

  patternSvg = computed(() => {
    const patterns = [
      `<svg viewBox="0 0 400 130" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><circle cx="80" cy="65" r="55" stroke="currentColor" stroke-width="0.5"/><circle cx="80" cy="65" r="35" stroke="currentColor" stroke-width="0.5"/><circle cx="320" cy="65" r="70" stroke="currentColor" stroke-width="0.5"/><circle cx="320" cy="65" r="40" stroke="currentColor" stroke-width="0.5"/><line x1="0" y1="65" x2="400" y2="65" stroke="currentColor" stroke-width="0.5"/><line x1="200" y1="0" x2="200" y2="130" stroke="currentColor" stroke-width="0.5"/></svg>`,
      `<svg viewBox="0 0 400 130" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><polygon points="200,10 380,120 20,120" stroke="currentColor" stroke-width="0.5" fill="none"/><polygon points="200,35 340,110 60,110" stroke="currentColor" stroke-width="0.5" fill="none"/><polygon points="200,60 300,110 100,110" stroke="currentColor" stroke-width="0.5" fill="none"/><line x1="20" y1="0" x2="200" y2="130" stroke="currentColor" stroke-width="0.4"/><line x1="380" y1="0" x2="200" y2="130" stroke="currentColor" stroke-width="0.4"/></svg>`,
      `<svg viewBox="0 0 400 130" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect x="60" y="20" width="80" height="90" stroke="currentColor" stroke-width="0.5" fill="none"/><rect x="80" y="35" width="40" height="60" stroke="currentColor" stroke-width="0.5" fill="none"/><rect x="260" y="15" width="80" height="90" stroke="currentColor" stroke-width="0.5" fill="none"/><rect x="275" y="30" width="50" height="65" stroke="currentColor" stroke-width="0.5" fill="none"/><line x1="140" y1="65" x2="260" y2="65" stroke="currentColor" stroke-width="0.5"/></svg>`,
      `<svg viewBox="0 0 400 130" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><line x1="0" y1="0" x2="400" y2="130" stroke="currentColor" stroke-width="0.5"/><line x1="0" y1="65" x2="400" y2="65" stroke="currentColor" stroke-width="0.5"/><line x1="400" y1="0" x2="0" y2="130" stroke="currentColor" stroke-width="0.5"/><line x1="133" y1="0" x2="133" y2="130" stroke="currentColor" stroke-width="0.4"/><line x1="266" y1="0" x2="266" y2="130" stroke="currentColor" stroke-width="0.4"/><circle cx="200" cy="65" r="40" stroke="currentColor" stroke-width="0.5"/></svg>`,
    ];

    return patterns[this.toneIndex()];
  });
}
