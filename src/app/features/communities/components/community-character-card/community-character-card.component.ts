import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommunityCharacter } from '../../models/community-character.model';

@Component({
  selector: 'app-community-character-card',
  standalone: true,
  template: `
    @if (character) {
      <article class="cc-card">
        <div class="avatar">
          @if (character.avatarUrl) {
            <img [src]="character.avatarUrl" [alt]="character.name" />
          } @else {
            <span>{{ character.name.charAt(0) }}</span>
          }
        </div>
        <div class="body">
          <h4>{{ character.name }}</h4>
          @if (character.description) {
            <p class="desc">{{ character.description }}</p>
          }
          @if (canManage) {
            <div class="actions">
              <button type="button" (click)="edit.emit(character)">Editar</button>
              <button type="button" class="danger" (click)="remove.emit(character)">
                Eliminar
              </button>
            </div>
          }
        </div>
      </article>
    }
  `,
  styles: [
    `
      .cc-card {
        display: grid;
        grid-template-columns: 64px 1fr;
        gap: 0.75rem;
        padding: 0.85rem;
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: var(--bg-card);
      }
      .avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--bg-surface);
        display: grid;
        place-items: center;
        overflow: hidden;
        font-size: 1.5rem;
        color: var(--text-2);
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .body {
        display: grid;
        gap: 0.4rem;
      }
      h4 {
        margin: 0;
        font-size: 1rem;
      }
      .desc {
        margin: 0;
        color: var(--text-2);
        font-size: 0.85rem;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .actions {
        display: flex;
        gap: 0.4rem;
      }
      .actions button {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-1);
        border-radius: 0.6rem;
        padding: 0.35rem 0.7rem;
        font-size: 0.8rem;
        cursor: pointer;
      }
      .actions .danger {
        color: #ff8b8b;
      }
    `,
  ],
})
export class CommunityCharacterCardComponent {
  @Input() character!: CommunityCharacter;
  @Input() canManage = false;
  @Output() edit = new EventEmitter<CommunityCharacter>();
  @Output() remove = new EventEmitter<CommunityCharacter>();
}
