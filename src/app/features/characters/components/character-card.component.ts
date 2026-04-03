import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterSummary } from '../../../core/models/character.model';

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="character-card">
      <div class="avatar">{{ character.name.charAt(0) }}</div>

      <div class="body">
        <div class="eyebrow">
          <a [routerLink]="['/perfil', character.author.username]"
            >@{{ character.author.username }}</a
          >
          <span class="chip">{{ character.role }}</span>
        </div>

        <a class="title" [routerLink]="['/personajes', character.author.username, character.slug]">
          {{ character.name }}
        </a>
        <p class="excerpt">
          {{ character.personality || character.backstory || 'Sin descripcion breve.' }}
        </p>

        <div class="meta">
          @if (character.world) {
            <a [routerLink]="['/mundos', character.world.slug]">{{ character.world.name }}</a>
          }
          <span>{{ character.stats.relationshipsCount }} relaciones</span>
          <span>{{ character.stats.novelsCount }} novelas</span>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .character-card {
        display: grid;
        grid-template-columns: 84px 1fr;
        gap: 1rem;
        padding: 1rem;
        border-radius: 1.2rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        box-shadow: 0 14px 32px color-mix(in srgb, var(--bg) 82%, transparent);
      }
      .avatar {
        width: 84px;
        height: 84px;
        display: grid;
        place-items: center;
        border-radius: 1rem;
        background: linear-gradient(
          135deg,
          var(--accent-glow),
          color-mix(in srgb, var(--bg-card) 80%, white 20%)
        );
        color: var(--accent-text);
        font-size: 2rem;
        font-weight: 700;
      }
      .body {
        display: grid;
        gap: 0.65rem;
      }
      .eyebrow,
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        align-items: center;
      }
      .eyebrow a,
      .meta a,
      .title {
        color: var(--text-1);
        text-decoration: none;
      }
      .title {
        font-size: 1.08rem;
        font-weight: 700;
      }
      .excerpt,
      .meta {
        color: var(--text-2);
      }
      .excerpt {
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .chip {
        padding: 0.3rem 0.65rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.82rem;
      }
      @media (max-width: 720px) {
        .character-card {
          grid-template-columns: 1fr;
        }
        .avatar {
          width: 72px;
          height: 72px;
        }
      }
    `,
  ],
})
export class CharacterCardComponent {
  @Input({ required: true }) character!: CharacterSummary;
}
