import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserSearchResult } from '../../../core/models/search.model';
import { AuthService } from '../../../core/services/auth.service';
import { FollowsService } from '../../../core/services/follows.service';

@Component({
  selector: 'app-author-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="author-card">
      <a class="band" [class]="bandClass()" [routerLink]="['/perfil', author().username]">
        <span class="band-texture"></span>
        <span class="avatar" [class]="avatarClass()">
          {{ author().display_name.charAt(0) }}
        </span>
      </a>

      <div class="body">
        <a class="identity" [routerLink]="['/perfil', author().username]">
          <strong class="name">{{ author().display_name }}</strong>
          <span class="handle">@{{ author().username }}</span>
        </a>

        <p class="bio">{{ author().bio || 'Sin biografia por ahora.' }}</p>

        <div class="stats-row">
          <span class="stat-item">
            <span class="stat-value">{{ author().stats.followers_count }}</span>
            <span class="stat-label">seguidores</span>
          </span>
          <span class="stat-divider"></span>
          <span class="stat-item">
            <span class="stat-value">{{ author().stats.novels_count }}</span>
            <span class="stat-label">novelas</span>
          </span>
          <span class="stat-divider"></span>
          <span class="stat-item">
            <span class="stat-value">{{ author().stats.worlds_count }}</span>
            <span class="stat-label">mundos</span>
          </span>
        </div>

        @if (coverDots().length) {
          <div class="covers" aria-label="Actividad reciente">
            @for (dot of coverDots(); track $index) {
              <span class="cover-dot" [class.filled]="dot"></span>
            }
          </div>
        }
      </div>

      @if (canFollow()) {
        <div class="footer">
          <button
            type="button"
            class="follow-button"
            [class.following]="followed()"
            [disabled]="loading()"
            (click)="toggleFollow()"
          >
            <span class="button-icon" aria-hidden="true">
              @if (followed()) {
                ✓
              } @else {
                +
              }
            </span>
            {{ loading() ? 'Procesando...' : followed() ? 'Siguiendo' : 'Seguir' }}
          </button>
        </div>
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .author-card {
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-width: 240px;
        height: 100%;
        border-radius: 1.3rem;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--border) 86%, rgba(255, 255, 255, 0.06));
        background: color-mix(in srgb, var(--bg-card) 94%, #0d1117 6%);
        box-shadow: 0 22px 42px rgba(7, 10, 16, 0.16);
      }

      .band {
        position: relative;
        display: block;
        height: 3.45rem;
        text-decoration: none;
        overflow: visible;
      }

      .band-tone-0 {
        background: linear-gradient(180deg, #1f2737, #151b28);
        color: #8ea3d7;
      }

      .band-tone-1 {
        background: linear-gradient(180deg, #1d2f2a, #101d18);
        color: #70ba9a;
      }

      .band-tone-2 {
        background: linear-gradient(180deg, #2c2133, #1a121f);
        color: #b18bd6;
      }

      .band-tone-3 {
        background: linear-gradient(180deg, #32231d, #1d1511);
        color: #d4a36f;
      }

      .band-tone-4 {
        background: linear-gradient(180deg, #2d2b1a, #1b190f);
        color: #d2bf75;
      }

      .band-texture {
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

      .avatar {
        position: absolute;
        left: 1rem;
        bottom: -1.35rem;
        display: grid;
        place-items: center;
        width: 2.9rem;
        height: 2.9rem;
        border-radius: 50%;
        border: 2px solid color-mix(in srgb, var(--bg-card) 94%, #0d1117 6%);
        font:
          italic 400 1.35rem/1 'Playfair Display',
          serif;
      }

      .avatar-tone-0 {
        background: #1f2737;
        color: #8ea3d7;
      }

      .avatar-tone-1 {
        background: #1d2f2a;
        color: #70ba9a;
      }

      .avatar-tone-2 {
        background: #2c2133;
        color: #b18bd6;
      }

      .avatar-tone-3 {
        background: #32231d;
        color: #d4a36f;
      }

      .avatar-tone-4 {
        background: #2d2b1a;
        color: #d2bf75;
      }

      .body {
        display: grid;
        gap: 0.7rem;
        padding: 1.95rem 1rem 0;
      }

      .identity {
        display: grid;
        gap: 0.2rem;
        text-decoration: none;
        min-width: 0;
      }

      .name {
        color: var(--text-1);
        font:
          400 1rem/1.2 'Playfair Display',
          serif;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .handle {
        color: var(--accent-text);
        font-size: 0.75rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bio {
        margin: 0;
        color: var(--text-2);
        font-size: 0.78rem;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: calc(1.5em * 2);
      }

      .stats-row {
        display: flex;
        align-items: center;
        gap: 0.62rem;
        flex-wrap: wrap;
      }

      .stat-item {
        display: inline-flex;
        align-items: baseline;
        gap: 0.22rem;
        font-size: 0.72rem;
      }

      .stat-value {
        color: var(--text-1);
        font-weight: 700;
      }

      .stat-label {
        color: var(--text-3);
      }

      .stat-divider {
        width: 1px;
        height: 0.8rem;
        background: color-mix(in srgb, var(--border) 82%, rgba(255, 255, 255, 0.04));
      }

      .covers {
        display: flex;
        align-items: center;
        gap: 0.38rem;
        min-height: 0.7rem;
      }

      .cover-dot {
        width: 0.42rem;
        height: 0.42rem;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--border) 86%, rgba(255, 255, 255, 0.06));
        background: transparent;
      }

      .cover-dot.filled {
        background: var(--accent-text);
        border-color: transparent;
        box-shadow: 0 0 0.55rem color-mix(in srgb, var(--accent-text) 34%, transparent);
      }

      .footer {
        padding: 0.95rem 1rem 1rem;
      }

      .follow-button {
        width: 100%;
        min-height: 2.35rem;
        border-radius: 0.9rem;
        border: 1px solid color-mix(in srgb, var(--border) 86%, rgba(255, 255, 255, 0.06));
        background: transparent;
        color: var(--text-1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.42rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          color 160ms ease,
          opacity 160ms ease;
      }

      .follow-button:hover:not(:disabled) {
        background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
        border-color: var(--border-s);
      }

      .follow-button.following {
        background: color-mix(in srgb, var(--accent-glow) 64%, transparent);
        color: var(--accent-text);
        border-color: color-mix(in srgb, var(--accent-text) 22%, var(--border));
      }

      .follow-button:disabled {
        cursor: progress;
        opacity: 0.78;
      }

      .button-icon {
        display: inline-grid;
        place-items: center;
        width: 1rem;
      }
    `,
  ],
})
export class AuthorCardComponent {
  private readonly authService = inject(AuthService);
  private readonly followsService = inject(FollowsService);

  readonly author = input.required<UserSearchResult>();
  readonly followed = signal(false);
  readonly loading = signal(false);
  readonly toneIndex = computed(() => {
    const username = this.author().username;
    return [...username].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
  });
  readonly coverDots = computed(() =>
    (this.author().latest_covers ?? []).slice(0, 3).map((cover) => Boolean(cover)),
  );

  bandClass() {
    return `band-tone-${this.toneIndex()}`;
  }

  avatarClass() {
    return `avatar-tone-${this.toneIndex()}`;
  }

  canFollow() {
    const currentUser = this.authService.getCurrentUserSnapshot();
    return Boolean(currentUser && currentUser.username !== this.author().username);
  }

  toggleFollow() {
    if (!this.canFollow() || this.loading()) {
      return;
    }

    this.loading.set(true);
    const action = this.followed()
      ? this.followsService.unfollow(this.author().username)
      : this.followsService.follow(this.author().username);

    action.subscribe({
      next: () => {
        this.followed.update((value) => !value);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
