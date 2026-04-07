import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { COMMUNITY_TYPE_LABELS, Community } from './models/community.model';
import { CommunityService } from './services/community.service';

@Component({
  selector: 'app-community-detail-page',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (notFound()) {
      <p class="empty">Comunidad no encontrada.</p>
    } @else if (community(); as c) {
      <section class="shell">
        <div class="banner" [style.background-image]="bannerBg()">
          <div class="cover">
            @if (c.coverUrl) {
              <img [src]="c.coverUrl" [alt]="c.name" />
            } @else {
              <span>{{ c.name.charAt(0) }}</span>
            }
          </div>
        </div>

        <div class="title-row">
          <h1>{{ c.name }}</h1>
          <span class="type-badge" [class]="'type-' + c.type.toLowerCase()">
            {{ typeLabel() }}
          </span>
        </div>

        @if (c.status === 'PENDING' && c.isOwner) {
          <div class="alert warn">⏳ Esta comunidad está pendiente de aprobación.</div>
        }
        @if (c.status === 'SUSPENDED') {
          <div class="alert danger">⚠ Esta comunidad está suspendida.</div>
        }
        @if (c.status === 'REJECTED' && c.isOwner && c.rejectionReason) {
          <div class="alert danger">
            <strong>Rechazada:</strong> {{ c.rejectionReason }}
          </div>
        }

        <div class="grid">
          <main class="main">
            @if (c.description) {
              <section class="block">
                <h2>Descripción</h2>
                <p class="desc">{{ c.description }}</p>
              </section>
            }
            @if (c.rules) {
              <section class="block">
                <h2>Reglas</h2>
                <div class="markdown" [innerHTML]="rulesHtml()"></div>
              </section>
            }
            <section class="block">
              <h2>Foros</h2>
              <p class="muted">Los foros estarán disponibles próximamente.</p>
            </section>
          </main>

          <aside class="side">
            @if (c.status === 'ACTIVE') {
              @if (isAuth()) {
                <div class="actions">
                  @if (!c.isMember && !c.isOwner) {
                    <button class="primary" type="button" (click)="join()">Unirse</button>
                  }
                  @if (c.isMember && !c.isOwner) {
                    <button type="button" (click)="confirmLeave()">✓ Miembro</button>
                  }
                  @if (c.isOwner) {
                    <p class="owner-note">Eres el creador</p>
                  }
                  @if (!c.isFollowing) {
                    <button type="button" (click)="follow()">Seguir</button>
                  } @else {
                    <button type="button" (click)="unfollow()">Siguiendo</button>
                  }
                  @if (c.isOwner) {
                    <a class="manage" [routerLink]="['/mis-comunidades', c.slug, 'editar']">
                      Gestionar comunidad
                    </a>
                  }
                </div>
              } @else {
                <a class="primary" [routerLink]="['/login']" [queryParams]="{ returnUrl: '/comunidades/' + c.slug }">
                  Inicia sesión para unirte
                </a>
              }
            }

            @if (c.owner) {
              <div class="card">
                <h3>Creador</h3>
                <a class="owner-link" [routerLink]="['/perfil', c.owner.username]">
                  <div class="avatar">
                    @if (c.owner.avatarUrl) {
                      <img [src]="c.owner.avatarUrl" [alt]="c.owner.displayName" />
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
                      <img [src]="c.linkedNovel.coverUrl" [alt]="c.linkedNovel.title" />
                    } @else {
                      <span>{{ c.linkedNovel.title.charAt(0) }}</span>
                    }
                  </div>
                  <span>{{ c.linkedNovel.title }}</span>
                </a>
              </div>
            }

            <div class="card stats">
              <div><strong>{{ c.membersCount }}</strong><span>Miembros</span></div>
              <div><strong>{{ c.followersCount }}</strong><span>Seguidores</span></div>
            </div>
          </aside>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .shell {
        display: grid;
        gap: 1.25rem;
      }
      .banner {
        position: relative;
        height: 200px;
        border-radius: 1rem;
        background: linear-gradient(135deg, var(--accent-glow), var(--bg-surface));
        background-size: cover;
        background-position: center;
      }
      .cover {
        position: absolute;
        bottom: -20px;
        left: 1.25rem;
        width: 80px;
        height: 80px;
        border-radius: 1rem;
        background: var(--bg-card);
        border: 3px solid var(--bg-card);
        overflow: hidden;
        display: grid;
        place-items: center;
        font-size: 2rem;
      }
      .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .title-row h1 {
        margin: 0;
      }
      .type-badge {
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        font-size: 0.72rem;
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
      .alert {
        padding: 0.85rem 1rem;
        border-radius: 0.75rem;
        font-size: 0.9rem;
      }
      .alert.warn {
        background: rgba(214, 176, 80, 0.15);
        color: #d4ac6b;
        border: 1px solid rgba(214, 176, 80, 0.35);
      }
      .alert.danger {
        background: rgba(214, 90, 90, 0.15);
        color: #e49d9d;
        border: 1px solid rgba(214, 90, 90, 0.35);
      }
      .grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.5rem;
      }
      .block {
        margin-bottom: 1.5rem;
      }
      .block h2 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
      }
      .desc {
        white-space: pre-wrap;
        color: var(--text-2);
      }
      .markdown :global(p) {
        margin: 0 0 0.5rem;
      }
      .muted {
        color: var(--text-3);
      }
      .side {
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
      .owner-note {
        margin: 0;
        text-align: center;
        color: var(--text-2);
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
      .empty {
        text-align: center;
        color: var(--text-2);
      }
      @media (max-width: 800px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CommunityDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CommunityService);
  private readonly authService = inject(AuthService);
  private readonly markdown = inject(MarkdownService);
  private readonly dialog = inject(MatDialog);

  readonly community = signal<Community | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly typeLabel = computed(() => {
    const c = this.community();
    return c ? COMMUNITY_TYPE_LABELS[c.type] : '';
  });

  isAuth(): boolean {
    return this.authService.isAuthenticated();
  }

  bannerBg(): string {
    const c = this.community();
    if (!c) return '';
    const url = c.bannerUrl || c.coverUrl;
    return url ? `url("${url}")` : '';
  }

  rulesHtml(): string {
    const c = this.community();
    if (!c?.rules) return '';
    return this.markdown.render(c.rules);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.loading.set(true);
      this.notFound.set(false);
      this.service.getCommunityBySlug(slug).subscribe({
        next: (c) => {
          this.community.set(c);
          this.loading.set(false);
        },
        error: (err) => {
          if (err?.status === 404) this.notFound.set(true);
          this.loading.set(false);
        },
      });
    });
  }

  join(): void {
    const c = this.community();
    if (!c) return;
    this.community.set({ ...c, isMember: true, membersCount: c.membersCount + 1 });
    this.service.join(c.slug).subscribe({
      next: (r) =>
        this.community.update((cur) =>
          cur ? { ...cur, isMember: r.isMember, membersCount: r.membersCount } : cur,
        ),
      error: () =>
        this.community.update((cur) =>
          cur ? { ...cur, isMember: false, membersCount: Math.max(0, cur.membersCount - 1) } : cur,
        ),
    });
  }

  confirmLeave(): void {
    const c = this.community();
    if (!c) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Salir de la comunidad',
          description: `¿Seguro que deseas salir de "${c.name}"?`,
          confirmText: 'Salir',
          cancelText: 'Cancelar',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.community.update((cur) =>
          cur ? { ...cur, isMember: false, membersCount: Math.max(0, cur.membersCount - 1) } : cur,
        );
        this.service.leave(c.slug).subscribe({
          next: (r) =>
            this.community.update((cur) =>
              cur ? { ...cur, isMember: r.isMember, membersCount: r.membersCount } : cur,
            ),
        });
      });
  }

  follow(): void {
    const c = this.community();
    if (!c) return;
    this.community.set({ ...c, isFollowing: true, followersCount: c.followersCount + 1 });
    this.service.follow(c.slug).subscribe({
      next: (r) =>
        this.community.update((cur) =>
          cur ? { ...cur, isFollowing: r.isFollowing, followersCount: r.followersCount } : cur,
        ),
      error: () =>
        this.community.update((cur) =>
          cur
            ? { ...cur, isFollowing: false, followersCount: Math.max(0, cur.followersCount - 1) }
            : cur,
        ),
    });
  }

  unfollow(): void {
    const c = this.community();
    if (!c) return;
    this.community.set({
      ...c,
      isFollowing: false,
      followersCount: Math.max(0, c.followersCount - 1),
    });
    this.service.unfollow(c.slug).subscribe({
      next: (r) =>
        this.community.update((cur) =>
          cur ? { ...cur, isFollowing: r.isFollowing, followersCount: r.followersCount } : cur,
        ),
    });
  }
}
