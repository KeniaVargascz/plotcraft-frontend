import { Component, inject, input, signal } from '@angular/core';
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
      <a class="identity" [routerLink]="['/perfil', author().username]">
        <div class="avatar">{{ author().display_name.charAt(0) }}</div>
        <div class="identity-copy">
          <strong>{{ author().display_name }}</strong>
          <span>@{{ author().username }}</span>
        </div>
      </a>

      <p class="bio">{{ author().bio || 'Sin biografia por ahora.' }}</p>

      <div class="stats">
        <span>{{ author().stats.followers_count }} seguidores</span>
        <span>{{ author().stats.novels_count }} novelas</span>
      </div>

      @if (author().latest_covers?.length) {
        <div class="covers">
          @for (cover of author().latest_covers; track $index) {
            <span>{{ cover ? '●' : '○' }}</span>
          }
        </div>
      }

      @if (canFollow()) {
        <button type="button" [disabled]="loading()" (click)="toggleFollow()">
          {{ followed() ? 'Dejar de seguir' : 'Seguir' }}
        </button>
      }
    </article>
  `,
  styles: [
    `
      .author-card {
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
        border-radius: 1.2rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        min-width: 240px;
      }

      .identity,
      .stats,
      .covers {
        display: flex;
        align-items: center;
        gap: 0.7rem;
      }

      .identity {
        text-decoration: none;
        color: var(--text-1);
      }

      .identity-copy {
        display: grid;
        gap: 0.1rem;
      }

      .identity-copy span,
      .bio,
      .stats {
        color: var(--text-2);
      }

      .avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-weight: 700;
      }

      .bio {
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .stats {
        padding-top: 0.1rem;
        border-top: 1px solid var(--border);
        flex-wrap: wrap;
      }

      .covers span {
        color: var(--accent-text);
      }

      button {
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--accent-glow);
        color: var(--accent-text);
        padding: 0.75rem 1rem;
        cursor: pointer;
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
