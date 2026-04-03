import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterRole, CharacterSummary } from '../../../core/models/character.model';

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="character-card">
      <div class="avatar-strip">
        <a class="avatar" [class]="avatarClass()" [routerLink]="characterLink()">
          <span class="avatar-texture"></span>
          <span class="avatar-letter">{{ character.name.charAt(0) }}</span>
        </a>

        <div class="avatar-meta">
          <span class="role-badge" [class]="roleClass()">{{ roleLabel() }}</span>
          <a class="author-link" [routerLink]="['/perfil', character.author.username]">
            @{{ character.author.username }}
          </a>
        </div>
      </div>

      <div class="card-body">
        <a class="title" [routerLink]="characterLink()">{{ character.name }}</a>
        <p class="excerpt">
          {{ character.personality || character.backstory || 'Sin descripcion breve.' }}
        </p>

        @if (character.world) {
          <a class="world-link" [routerLink]="['/mundos', character.world.slug]">
            <span class="world-icon">[]</span>
            <span>{{ character.world.name }}</span>
          </a>
        }
      </div>

      <footer class="card-footer">
        <span class="stat">
          <span class="stat-value">{{ character.stats.relationshipsCount }}</span>
          <span class="stat-label">relaciones</span>
        </span>
        <span class="divider"></span>
        <span class="stat">
          <span class="stat-value">{{ character.stats.novelsCount }}</span>
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

      .character-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        border-radius: 1.2rem;
        border: 1px solid color-mix(in srgb, var(--border) 86%, rgba(255, 255, 255, 0.08));
        background: color-mix(in srgb, var(--bg-card) 92%, #0b0f14 8%);
        box-shadow: 0 16px 32px rgba(7, 10, 16, 0.18);
        overflow: hidden;
      }

      .avatar-strip {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem 1rem 0;
      }

      .avatar {
        position: relative;
        width: 3.25rem;
        height: 3.25rem;
        flex-shrink: 0;
        border-radius: 0.9rem;
        display: grid;
        place-items: center;
        overflow: hidden;
        text-decoration: none;
      }

      .avatar-tone-0 {
        background: linear-gradient(180deg, #1e2535, #121927);
        color: #89a0db;
      }

      .avatar-tone-1 {
        background: linear-gradient(180deg, #2e1e1e, #1d1212);
        color: #d18d8d;
      }

      .avatar-tone-2 {
        background: linear-gradient(180deg, #1d2f2a, #101c18);
        color: #67ba98;
      }

      .avatar-tone-3 {
        background: linear-gradient(180deg, #2d2033, #1a111f);
        color: #b589d7;
      }

      .avatar-tone-4 {
        background: linear-gradient(180deg, #302d1d, #1d1a10);
        color: #d5c46e;
      }

      .avatar-texture {
        position: absolute;
        inset: 0;
        opacity: 0.08;
        background-image: repeating-linear-gradient(
          45deg,
          currentColor 0,
          currentColor 1px,
          transparent 1px,
          transparent 7px
        );
      }

      .avatar-letter {
        position: relative;
        z-index: 1;
        font:
          italic 400 1.65rem/1 'Playfair Display',
          serif;
      }

      .avatar-meta {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
        padding-top: 0.1rem;
      }

      .role-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        padding: 0.18rem 0.55rem;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .role-protagonist {
        background: rgba(91, 175, 214, 0.12);
        border-color: rgba(91, 175, 214, 0.28);
        color: #77c4ea;
      }

      .role-antagonist,
      .role-rival {
        background: rgba(214, 123, 123, 0.12);
        border-color: rgba(214, 123, 123, 0.28);
        color: #de9292;
      }

      .role-mentor {
        background: rgba(200, 154, 74, 0.12);
        border-color: rgba(200, 154, 74, 0.28);
        color: #d5b06d;
      }

      .role-ally {
        background: rgba(93, 184, 122, 0.12);
        border-color: rgba(93, 184, 122, 0.28);
        color: #78cc95;
      }

      .role-secondary,
      .role-neutral,
      .role-background {
        background: rgba(181, 137, 215, 0.12);
        border-color: rgba(181, 137, 215, 0.28);
        color: #c29be0;
      }

      .author-link,
      .title,
      .world-link {
        text-decoration: none;
      }

      .author-link {
        color: var(--text-3);
        font-size: 0.74rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-body {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.45rem;
        padding: 0.85rem 1rem 0;
        min-width: 0;
      }

      .title {
        color: var(--text-1);
        font:
          700 1.1rem/1.25 'Playfair Display',
          serif;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .excerpt {
        margin: 0;
        color: var(--text-2);
        font-size: 0.82rem;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: calc(1.5em * 2);
      }

      .world-link {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-width: 0;
        color: var(--accent-text);
        font-size: 0.76rem;
        font-style: italic;
        white-space: nowrap;
      }

      .world-link span:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .world-icon {
        opacity: 0.7;
        font-size: 0.66rem;
        letter-spacing: -0.08em;
      }

      .card-footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.9rem;
        padding: 0.8rem 1rem 0.9rem;
        border-top: 1px solid color-mix(in srgb, var(--border) 86%, rgba(255, 255, 255, 0.08));
      }

      .stat {
        display: inline-flex;
        align-items: baseline;
        gap: 0.28rem;
      }

      .stat-value {
        color: var(--text-1);
        font-size: 0.82rem;
        font-weight: 700;
      }

      .stat-label {
        color: var(--text-3);
        font-size: 0.72rem;
      }

      .divider {
        width: 1px;
        height: 0.85rem;
        background: color-mix(in srgb, var(--border) 86%, rgba(255, 255, 255, 0.08));
      }

      @media (max-width: 720px) {
        .character-card {
          min-height: 0;
        }
      }
    `,
  ],
})
export class CharacterCardComponent {
  @Input({ required: true }) character!: CharacterSummary;

  characterLink() {
    return ['/personajes', this.character.author.username, this.character.slug];
  }

  roleLabel(): string {
    return this.formatRole(this.character.role);
  }

  roleClass(): string {
    return `role-${this.character.role.toLowerCase()}`;
  }

  avatarClass(): string {
    return `avatar avatar-tone-${this.coverToneIndex(this.character.slug)}`;
  }

  private formatRole(role: CharacterRole): string {
    switch (role) {
      case 'PROTAGONIST':
        return 'Protagonista';
      case 'ANTAGONIST':
        return 'Antagonista';
      case 'MENTOR':
        return 'Mentor';
      case 'ALLY':
        return 'Aliado';
      case 'RIVAL':
        return 'Rival';
      case 'NEUTRAL':
        return 'Neutral';
      case 'BACKGROUND':
        return 'Fondo';
      case 'SECONDARY':
      default:
        return 'Secundario';
    }
  }

  private coverToneIndex(seed: string): number {
    return Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % 5;
  }
}
