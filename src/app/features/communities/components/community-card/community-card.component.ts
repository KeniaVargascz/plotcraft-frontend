import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
                <img
                  [src]="community.owner.avatarUrl"
                  [alt]="community.owner.displayName"
                  loading="lazy"
                />
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
          <p class="linked">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            {{ community.linkedNovel.title }}
          </p>
        }
        <footer class="footer">
          <span class="footer-stat">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {{ community.membersCount }} miembros
          </span>
          <span class="footer-sep">·</span>
          <span class="footer-stat">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
            {{ community.followersCount }} seguidores
          </span>
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
      .type-private,
      .type-public,
      .type-fandom {
        background: var(--accent-glow);
        border: 1px solid var(--border-s);
        color: var(--accent-text);
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
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-wrap: wrap;
        font-size: 0.78rem;
        color: var(--text-3);
        border-top: 1px solid var(--border);
        padding-top: 0.5rem;
      }
      .footer-stat {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .footer-stat svg {
        color: var(--accent-text);
        flex-shrink: 0;
      }
      .footer-sep {
        color: var(--text-3);
      }
      .linked {
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
      .linked svg {
        color: var(--accent-text);
        flex-shrink: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
