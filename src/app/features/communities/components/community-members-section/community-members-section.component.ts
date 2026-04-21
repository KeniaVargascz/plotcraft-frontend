import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunityMemberProfile } from '../../models/community.model';

const ROLE_LABELS: Record<string, string> = {
  MEMBER: 'Miembro',
  MODERATOR: 'Moderador',
  ADMIN: 'Admin',
};

@Component({
  selector: 'app-community-members-section',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="block">
      <h2>Miembros</h2>
      @if (loading) {
        <p class="muted">Cargando miembros...</p>
      } @else if (!members.length) {
        <p class="muted">Esta comunidad a&uacute;n no tiene miembros.</p>
      } @else {
        <ul class="members-list">
          @for (m of members; track m.id) {
            <li class="member-row">
              <a class="member-link" [routerLink]="['/perfil', m.user.username]">
                <div class="avatar">
                  @if (m.user.avatarUrl) {
                    <img [src]="m.user.avatarUrl" [alt]="m.user.displayName" loading="lazy" />
                  } @else {
                    <span>{{ m.user.displayName.charAt(0) }}</span>
                  }
                </div>
                <div class="info">
                  <strong>{{ m.user.displayName }}</strong>
                  <span class="username">&#64;{{ m.user.username }}</span>
                </div>
              </a>
              @if (m.role !== 'MEMBER') {
                <span class="role-badge" [class]="'role-' + m.role.toLowerCase()">
                  {{ roleLabel(m.role) }}
                </span>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      .block {
        margin-bottom: 1.5rem;
      }
      .block h2 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
      }
      .muted {
        color: var(--text-3);
      }
      .members-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.5rem;
      }
      .member-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.6rem 0.85rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--bg-card);
      }
      .member-link {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        text-decoration: none;
        color: var(--text-1);
      }
      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--bg-surface);
        overflow: hidden;
        display: grid;
        place-items: center;
        font-size: 0.9rem;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .info {
        display: grid;
        gap: 0.1rem;
      }
      .info strong {
        font-size: 0.9rem;
      }
      .username {
        font-size: 0.78rem;
        color: var(--text-3);
      }
      .role-badge {
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .role-moderator {
        background: rgba(80, 140, 220, 0.15);
        color: #508cdc;
      }
      .role-admin {
        background: rgba(150, 90, 200, 0.15);
        color: #965ac8;
      }
    `,
  ],
})
export class CommunityMembersSectionComponent {
  @Input() members: CommunityMemberProfile[] = [];
  @Input() loading = false;

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }
}
