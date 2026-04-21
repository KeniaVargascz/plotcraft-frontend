import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Community } from '../../models/community.model';

export interface CommunityViewerContext {
  isAuth: boolean;
}

@Component({
  selector: 'app-community-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (community; as c) {
      @if (c.status === 'ACTIVE') {
        @if (viewerContext.isAuth) {
          <div class="actions">
            @if (!c.isMember && !c.isOwner) {
              @if (c.type === 'PRIVATE' && !c.isFollowingOwner) {
                <button class="primary" type="button" disabled>Unirse</button>
                <p class="join-hint">Sigue al autor para poder unirte a su comunidad.</p>
              } @else {
                <button class="primary" type="button" (click)="joinClick.emit()">Unirse</button>
              }
            }
            @if (c.isMember && !c.isOwner) {
              <button type="button" (click)="leaveClick.emit()">&#x2713; Miembro</button>
            }
            @if (c.isOwner) {
              <p class="owner-note">Eres el creador</p>
            }
            @if (!c.isFollowing) {
              <button type="button" (click)="followClick.emit()">Seguir</button>
            } @else {
              <button type="button" (click)="unfollowClick.emit()">Siguiendo</button>
            }
            @if (c.isOwner) {
              <a class="manage" [routerLink]="['/mis-comunidades', c.slug, 'editar']">
                Gestionar comunidad
              </a>
            }
          </div>
        } @else {
          <a
            class="primary login-btn"
            [routerLink]="['/login']"
            [queryParams]="{ returnUrl: '/comunidades/' + c.slug }"
          >
            Inicia sesi&oacute;n para unirte
          </a>
        }
      }

      @if (c.owner) {
        <div class="card">
          <h3>Creador</h3>
          <a class="owner-link" [routerLink]="['/perfil', c.owner.username]">
            <div class="avatar">
              @if (c.owner.avatarUrl) {
                <img [src]="c.owner.avatarUrl" [alt]="c.owner.displayName" loading="lazy" />
              } @else {
                <span>{{ c.owner.displayName.charAt(0) }}</span>
              }
            </div>
            <div>
              <strong>{{ c.owner.displayName }}</strong>
              <span>&#64;{{ c.owner.username }}</span>
            </div>
          </a>
        </div>
      }

      @if (c.linkedNovel) {
        <div class="card">
          <h3>Novela vinculada</h3>
          <a class="novel-link" [routerLink]="['/novelas', c.linkedNovel.slug]">
            <div class="novel-cover">
              @if (c.linkedNovel.coverUrl) {
                <img
                  [src]="c.linkedNovel.coverUrl"
                  [alt]="c.linkedNovel.title"
                  loading="lazy"
                />
              } @else {
                <span>{{ c.linkedNovel.title.charAt(0) }}</span>
              }
            </div>
            <span>{{ c.linkedNovel.title }}</span>
          </a>
        </div>
      }

      <div class="card stats">
        <div>
          <strong>{{ c.membersCount }}</strong
          ><span>Miembros</span>
        </div>
        <div>
          <strong>{{ c.followersCount }}</strong
          ><span>Seguidores</span>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 1rem;
        align-content: start;
      }
      .actions {
        display: grid;
        gap: 0.5rem;
      }
      .actions button,
      .actions .manage,
      .actions .primary {
        padding: 0.65rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
        text-decoration: none;
        text-align: center;
        font-weight: 600;
      }
      .actions .primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      .login-btn {
        display: block;
        padding: 0.65rem 1rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        border: none;
        text-decoration: none;
        text-align: center;
        font-weight: 600;
      }
      .owner-note {
        margin: 0;
        text-align: center;
        color: var(--text-2);
      }
      .join-hint {
        margin: 0;
        font-size: 0.78rem;
        color: var(--text-3);
        text-align: center;
      }
      button.primary[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .card {
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .card h3 {
        margin: 0 0 0.5rem;
        font-size: 0.9rem;
        color: var(--text-2);
      }
      .owner-link,
      .novel-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        color: var(--text-1);
      }
      .owner-link span {
        display: block;
        font-size: 0.8rem;
        color: var(--text-3);
      }
      .avatar,
      .novel-cover {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--bg-surface);
        overflow: hidden;
        display: grid;
        place-items: center;
      }
      .novel-cover {
        border-radius: 0.5rem;
        width: 44px;
        height: 60px;
      }
      .avatar img,
      .novel-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .stats {
        display: flex;
        justify-content: space-around;
      }
      .stats div {
        text-align: center;
      }
      .stats strong {
        display: block;
        font-size: 1.25rem;
      }
      .stats span {
        font-size: 0.78rem;
        color: var(--text-3);
      }
    `,
  ],
})
export class CommunityHeaderComponent {
  @Input({ required: true }) community!: Community;
  @Input() viewerContext: CommunityViewerContext = { isAuth: false };

  @Output() joinClick = new EventEmitter<void>();
  @Output() leaveClick = new EventEmitter<void>();
  @Output() followClick = new EventEmitter<void>();
  @Output() unfollowClick = new EventEmitter<void>();
}
