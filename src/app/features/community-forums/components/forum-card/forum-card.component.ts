import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunityForum } from '../../models/community-forum.model';
import { CommunityForumsService } from '../../services/community-forums.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forum-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (forum(); as f) {
      <article class="forum-card">
        <header class="row">
          <div class="title">
            <span class="icon" aria-hidden="true">💬</span>
            <h3>{{ f.name }}</h3>
            @if (!f.isPublic) {
              <span class="badge private">Privado</span>
            }
          </div>
        </header>

        @if (f.description) {
          <p class="desc">{{ f.description }}</p>
        }

        <p class="stats">{{ f.membersCount }} miembros · {{ f.threadsCount }} hilos</p>

        @if (f.lastThread; as lt) {
          <p class="last-thread">
            <strong>Último:</strong> {{ lt.title }}
            <span class="time">· {{ relativeTime(lt.createdAt) }}</span>
          </p>
        }

        <div class="actions">
          @if (f.isMember) {
            <a class="btn primary" [routerLink]="['/comunidades', communitySlug, 'foros', f.slug]">
              Entrar
            </a>
          } @else if (f.isPublic) {
            @if (isAuth()) {
              <button class="btn primary" type="button" [disabled]="busy()" (click)="join()">
                Unirse
              </button>
            } @else {
              <a class="btn" [routerLink]="['/comunidades', communitySlug, 'foros', f.slug]">
                Ver foro
              </a>
            }
          } @else if (canEnterPrivate) {
            <a class="btn primary" [routerLink]="['/comunidades', communitySlug, 'foros', f.slug]">
              Entrar
            </a>
          } @else {
            <span class="locked">🔒 Solo para miembros de la comunidad</span>
          }
        </div>
      </article>
    }
  `,
  styles: [
    `
      .forum-card {
        display: grid;
        gap: 0.5rem;
        padding: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        border-radius: 1rem;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .title h3 {
        margin: 0;
        font-size: 1rem;
      }
      .icon {
        font-size: 1.1rem;
      }
      .badge.private {
        background: rgba(120, 120, 120, 0.85);
        color: #fff;
        font-size: 0.7rem;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        text-transform: uppercase;
        font-weight: 700;
      }
      .desc {
        margin: 0;
        color: var(--text-2);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .stats {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-3);
      }
      .last-thread {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-2);
      }
      .time {
        color: var(--text-3);
      }
      .actions {
        margin-top: 0.4rem;
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .btn {
        padding: 0.5rem 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
        cursor: pointer;
        font-weight: 600;
      }
      .btn.primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      .locked {
        color: var(--text-3);
        font-size: 0.85rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForumCardComponent {
  private readonly forumsService = inject(CommunityForumsService);
  private readonly authService = inject(AuthService);

  readonly forum = signal<CommunityForum | null>(null);
  readonly busy = signal(false);

  @Input() communitySlug!: string;
  @Input() canEnterPrivate = false;
  @Input({ required: true }) set value(v: CommunityForum) {
    this.forum.set(v);
  }
  @Output() changed = new EventEmitter<CommunityForum>();

  isAuth() {
    return this.authService.isAuthenticated();
  }

  relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'hace instantes';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days}d`;
    return `hace ${Math.floor(days / 30)}mes`;
  }

  join() {
    const f = this.forum();
    if (!f || this.busy()) return;
    this.busy.set(true);
    // optimistic
    const optimistic = { ...f, isMember: true, membersCount: f.membersCount + 1 };
    this.forum.set(optimistic);
    this.forumsService.joinForum(this.communitySlug, f.slug).subscribe({
      next: (r) => {
        const updated = { ...optimistic, isMember: r.isMember, membersCount: r.membersCount };
        this.forum.set(updated);
        this.changed.emit(updated);
        this.busy.set(false);
      },
      error: () => {
        this.forum.set(f);
        this.busy.set(false);
      },
    });
  }
}
