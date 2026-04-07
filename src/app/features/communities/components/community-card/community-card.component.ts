import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { COMMUNITY_TYPE_LABELS, Community } from '../../models/community.model';

@Component({
  selector: 'app-community-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a class="card" [routerLink]="['/comunidades', community.slug]">
      <div class="banner" [style.background-image]="bgImage()">
        <span class="type-badge" [class]="'type-' + community.type.toLowerCase()">
          {{ typeLabel() }}
        </span>
      </div>
      <div class="body">
        <h3 class="name">{{ community.name }}</h3>
        @if (community.owner) {
          <div class="owner">
            <div class="avatar">
              @if (community.owner.avatarUrl) {
                <img [src]="community.owner.avatarUrl" [alt]="community.owner.displayName" />
              } @else {
                <span>{{ community.owner.displayName.charAt(0) }}</span>
              }
            </div>
            <span>{{ community.owner.displayName }}</span>
          </div>
        }
        @if (community.description) {
          <p class="desc">{{ community.description }}</p>
        }
        @if (community.linkedNovel) {
          <p class="linked">📖 {{ community.linkedNovel.title }}</p>
        }
        <footer class="footer">
          👥 {{ community.membersCount }} miembros · ❤ {{ community.followersCount }} seguidores
        </footer>
      </div>
    </a>
  `,
  styles: [
    `
      .card {
        display: grid;
        grid-template-rows: 120px 1fr;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        overflow: hidden;
        text-decoration: none;
        color: var(--text-1);
        transition: transform 0.15s;
      }
      .card:hover {
        transform: translateY(-2px);
      }
      .banner {
        position: relative;
        background: linear-gradient(135deg, var(--accent-glow), var(--bg-surface));
        background-size: cover;
        background-position: center;
      }
      .type-badge {
        position: absolute;
        top: 0.6rem;
        left: 0.6rem;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .type-private {
        background: rgba(120, 120, 120, 0.85);
        color: #fff;
      }
      .type-public {
        background: rgba(80, 140, 220, 0.9);
        color: #fff;
      }
      .type-fandom {
        background: rgba(150, 90, 200, 0.9);
        color: #fff;
      }
      .body {
        padding: 0.85rem;
        display: grid;
        gap: 0.5rem;
      }
      .name {
        margin: 0;
        font-size: 1.05rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .owner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-2);
        font-size: 0.85rem;
      }
      .avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--bg-surface);
        display: grid;
        place-items: center;
        overflow: hidden;
        font-size: 0.75rem;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .desc {
        margin: 0;
        color: var(--text-2);
        font-size: 0.85rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .linked {
        margin: 0;
        font-size: 0.8rem;
        color: var(--accent-text);
      }
      .footer {
        font-size: 0.78rem;
        color: var(--text-3);
        border-top: 1px solid var(--border);
        padding-top: 0.5rem;
      }
    `,
  ],
})
export class CommunityCardComponent {
  @Input({ required: true }) community!: Community;

  typeLabel(): string {
    return COMMUNITY_TYPE_LABELS[this.community.type];
  }

  bgImage(): string {
    const url = this.community.bannerUrl || this.community.coverUrl;
    return url ? `url("${url}")` : '';
  }
}
