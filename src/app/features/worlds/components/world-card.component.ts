import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorldSummary } from '../../../core/models/world.model';

@Component({
  selector: 'app-world-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="world-card">
      <div class="cover">
        <span>{{ world.name.charAt(0) }}</span>
      </div>

      <div class="body">
        <div class="eyebrow">
          <a [routerLink]="['/perfil', world.author.username]">@{{ world.author.username }}</a>
          @if (showVisibility) {
            <span class="badge">{{ world.visibility === 'PUBLIC' ? 'Publico' : 'Privado' }}</span>
          }
        </div>

        <a class="title" [routerLink]="['/mundos', world.slug]">{{ world.name }}</a>
        <p class="tagline">{{ world.tagline || 'Sin tagline todavia.' }}</p>

        <div class="tags">
          @for (tag of world.tags.slice(0, 3); track tag) {
            <span>{{ tag }}</span>
          }
        </div>

        <div class="stats">
          <span>{{ world.stats.charactersCount }} personajes</span>
          <span>{{ world.stats.locationsCount }} lugares</span>
          <span>{{ world.stats.novelsCount }} novelas</span>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .world-card {
        display: grid;
        border-radius: 1.2rem;
        overflow: hidden;
        border: 1px solid var(--border);
        background: var(--bg-card);
        box-shadow: 0 14px 32px color-mix(in srgb, var(--bg) 82%, transparent);
      }
      .cover {
        min-height: 150px;
        display: grid;
        place-items: center;
        background:
          radial-gradient(
            circle at 20% 20%,
            color-mix(in srgb, var(--accent) 32%, white 68%),
            transparent 45%
          ),
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent) 22%, var(--bg-card)),
            var(--bg-surface)
          );
        color: var(--accent-text);
        font-size: 3rem;
        font-weight: 700;
      }
      .body {
        display: grid;
        gap: 0.85rem;
        padding: 1rem 1.1rem 1.15rem;
      }
      .eyebrow,
      .stats,
      .tags {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
        align-items: center;
      }
      .eyebrow a,
      .title {
        text-decoration: none;
        color: var(--text-1);
      }
      .title {
        font-size: 1.15rem;
        font-weight: 700;
      }
      .tagline,
      .stats {
        color: var(--text-2);
      }
      .tagline {
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .tags span,
      .badge {
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.85rem;
      }
      .stats {
        padding-top: 0.2rem;
        border-top: 1px solid var(--border);
      }
    `,
  ],
})
export class WorldCardComponent {
  @Input({ required: true }) world!: WorldSummary;
  @Input() showVisibility = false;
}
