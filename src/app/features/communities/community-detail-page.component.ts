import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { NovelsService } from '../../core/services/novels.service';
import { NovelSummary } from '../../core/models/novel.model';
import { MarkdownService } from '../../core/services/markdown.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { COMMUNITY_TYPE_LABELS, Community } from './models/community.model';
import { CommunityService } from './services/community.service';
import { CommunityForumsService } from '../community-forums/services/community-forums.service';
import { CommunityForum, DiscussedThread } from '../community-forums/models/community-forum.model';
import { ForumCardComponent } from '../community-forums/components/forum-card/forum-card.component';
import { CreateForumDialogComponent } from '../community-forums/components/create-forum-dialog/create-forum-dialog.component';
import { CommunityCharactersService } from './services/community-characters.service';
import { CommunityCharacter } from './models/community-character.model';
import {
  SuggestCharacterDialogComponent,
  SuggestCharacterDialogResult,
} from './components/suggest-character-dialog/suggest-character-dialog.component';
import { RejectCharacterDialogComponent } from './components/reject-character-dialog/reject-character-dialog.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CommunityHeaderComponent } from './components/community-header/community-header.component';
import { CommunityCharactersSectionComponent } from './components/community-characters-section/community-characters-section.component';

@Component({
  selector: 'app-community-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    LoadingSpinnerComponent,
    ForumCardComponent,
    TranslatePipe,
    CommunityHeaderComponent,
    CommunityCharactersSectionComponent,
  ],
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
              <img [src]="c.coverUrl" [alt]="c.name" loading="lazy" />
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
          <div class="alert warn">&#x23F3; Esta comunidad está pendiente de aprobación.</div>
        }
        @if (c.status === 'SUSPENDED') {
          <div class="alert danger">&#x26A0; Esta comunidad está suspendida.</div>
        }
        @if (c.status === 'REJECTED' && c.isOwner && c.rejectionReason) {
          <div class="alert danger"><strong>Rechazada:</strong> {{ c.rejectionReason }}</div>
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
              <div class="forums-head">
                <h2>Foros</h2>
                @if (c.isOwner) {
                  <button type="button" class="new-forum-btn" (click)="openCreateForum()">
                    + Nuevo foro
                  </button>
                }
              </div>
              @if (forumsLoading()) {
                <p class="muted">Cargando foros...</p>
              } @else if (forums().length === 0) {
                <p class="muted">Esta comunidad aún no tiene foros.</p>
              } @else {
                <div class="forum-list">
                  @for (f of forums(); track f.id) {
                    <app-forum-card
                      [value]="f"
                      [communitySlug]="c.slug"
                      [canEnterPrivate]="c.isMember || c.isOwner"
                      (changed)="onForumChanged($event)"
                    />
                  }
                </div>
              }
            </section>

            @if (c.type === 'PRIVATE') {
              <section class="block">
                <h2>Obras relacionadas</h2>
                @if (!c.relatedNovels?.length) {
                  <p class="muted">Aún no hay obras relacionadas.</p>
                } @else {
                  <ul class="related-list">
                    @for (n of c.relatedNovels; track n.id) {
                      <li class="related-item">
                        <a [routerLink]="['/novelas', n.slug]" class="rl-link">
                          <div class="rl-cover">
                            @if (n.coverUrl) {
                              <img [src]="n.coverUrl" [alt]="n.title" loading="lazy" />
                            } @else {
                              <span>{{ n.title.charAt(0) }}</span>
                            }
                          </div>
                          <span>{{ n.title }}</span>
                        </a>
                        @if (c.isOwner) {
                          <button type="button" class="rl-remove" (click)="removeRelated(n.id)">
                            ✕
                          </button>
                        }
                      </li>
                    }
                  </ul>
                }
                @if (c.isOwner) {
                  <div class="rl-add">
                    <select [(ngModel)]="selectedNovelId">
                      <option value="">— Selecciona una novela tuya —</option>
                      @for (n of pickableNovels(); track n.id) {
                        <option [value]="n.id">{{ n.title }}</option>
                      }
                    </select>
                    <button
                      type="button"
                      class="new-forum-btn"
                      [disabled]="!selectedNovelId || addingRelated()"
                      (click)="addRelated()"
                    >
                      {{ addingRelated() ? 'Agregando…' : '+ Agregar' }}
                    </button>
                  </div>
                  @if (relatedError()) {
                    <p class="muted error">{{ relatedError() }}</p>
                  }
                }
              </section>
            }

            @if (c.type === 'FANDOM') {
              <app-community-characters-section
                [characters]="catalog()"
                [suggestions]="suggestions()"
                [loading]="catalogLoading()"
                [canModerate]="canModerateCatalog()"
                [canSuggest]="canSuggest()"
                (suggestClick)="openSuggestCharacter()"
                (createClick)="openCreateCharacter()"
                (editClick)="editCharacter($event)"
                (deleteClick)="deleteCharacter($event)"
                (approveClick)="approveSuggestion($event)"
                (rejectClick)="rejectSuggestion($event)"
              />
            }

            @if (discussedThreads().length) {
              <section class="block">
                <h2>Foros comentando sobre {{ c.name }}</h2>
                <ul class="discussed-list">
                  @for (t of discussedThreads(); track t.id) {
                    <li class="discussed-item">
                      <a class="dt-title" [href]="t.url">{{ t.title }}</a>
                      <div class="dt-meta">
                        <span>@{{ t.author.username }}</span>
                        @if (t.forum) {
                          <span>· {{ t.forum.name }} en {{ t.forum.communityName }}</span>
                        } @else {
                          <span>· Foro general</span>
                        }
                        <span
                          >· {{ t.repliesCount }} respuestas ·
                          {{ t.reactionsCount }} reacciones</span
                        >
                      </div>
                    </li>
                  }
                </ul>
              </section>
            }
          </main>

          <aside class="side">
            <app-community-header
              [community]="c"
              [viewerContext]="{ isAuth: isAuth() }"
              (joinClick)="join()"
              (leaveClick)="confirmLeave()"
              (followClick)="follow()"
              (unfollowClick)="unfollow()"
            />
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
      .forums-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .new-forum-btn {
        padding: 0.45rem 0.85rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--accent-glow);
        color: var(--accent-text);
        cursor: pointer;
        font-weight: 600;
      }
      .forum-list {
        display: grid;
        gap: 0.75rem;
      }
      .discussed-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }
      .discussed-item {
        padding: 0.75rem 1rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--bg-card);
      }
      .dt-title {
        font-weight: 600;
        text-decoration: none;
        color: var(--text-1);
      }
      .dt-meta {
        margin-top: 0.25rem;
        font-size: 0.8rem;
        color: var(--text-3);
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .side {
        display: grid;
        gap: 1rem;
        align-content: start;
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
      .related-list {
        list-style: none;
        margin: 0.5rem 0 0.75rem;
        padding: 0;
        display: grid;
        gap: 0.5rem;
      }
      .related-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        background: var(--bg-surface);
      }
      .rl-link {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex: 1;
        text-decoration: none;
        color: var(--text-1);
      }
      .rl-cover {
        width: 36px;
        height: 50px;
        border-radius: 0.4rem;
        background: var(--bg-card);
        overflow: hidden;
        display: grid;
        place-items: center;
      }
      .rl-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .rl-remove {
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 0.4rem;
        color: var(--text-3);
        cursor: pointer;
        padding: 0.2rem 0.5rem;
      }
      .rl-add {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .rl-add select {
        flex: 1;
        padding: 0.55rem 0.7rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .muted.error {
        color: #ff8b8b;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CommunityService);
  private readonly authService = inject(AuthService);
  private readonly markdown = inject(MarkdownService);
  private readonly dialog = inject(MatDialog);
  private readonly forumsService = inject(CommunityForumsService);
  private readonly charactersService = inject(CommunityCharactersService);
  private readonly novelsService = inject(NovelsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly community = signal<Community | null>(null);
  readonly myNovels = signal<NovelSummary[]>([]);
  readonly addingRelated = signal(false);
  readonly relatedError = signal<string | null>(null);
  selectedNovelId = '';
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly forums = signal<CommunityForum[]>([]);
  readonly forumsLoading = signal(false);
  readonly discussedThreads = signal<DiscussedThread[]>([]);
  readonly catalog = signal<CommunityCharacter[]>([]);
  readonly suggestions = signal<CommunityCharacter[]>([]);
  readonly catalogLoading = signal(false);

  canModerateCatalog(): boolean {
    const c = this.community();
    return Boolean(c?.isOwner);
  }

  canSuggest(): boolean {
    const c = this.community();
    return Boolean(c && this.isAuth() && c.isMember && !c.isOwner);
  }

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
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.loading.set(true);
      this.notFound.set(false);
      this.service.getCommunityBySlug(slug).subscribe({
        next: (c) => {
          this.community.set(c);
          this.loading.set(false);
          this.loadForums(c.slug);
          if (c.type === 'FANDOM') {
            this.loadCatalog(c.slug);
          }
          if (c.type === 'PRIVATE' && c.isOwner && !this.myNovels().length) {
            this.novelsService.listMine({ limit: 100 }).subscribe({
              next: (res) => this.myNovels.set(res.data),
            });
          }
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

  pickableNovels(): NovelSummary[] {
    const c = this.community();
    if (!c) return [];
    const taken = new Set(c.relatedNovels?.map((n) => n.id) ?? []);
    if (c.linkedNovel) {
      // also exclude the main linked novel by slug-match (no id in payload)
    }
    return this.myNovels().filter((n) => !taken.has(n.id) && n.slug !== c.linkedNovel?.slug);
  }

  addRelated(): void {
    const c = this.community();
    if (!c || !this.selectedNovelId) return;
    this.addingRelated.set(true);
    this.relatedError.set(null);
    this.service.addRelatedNovel(c.slug, this.selectedNovelId).subscribe({
      next: (updated) => {
        this.community.set(updated);
        this.selectedNovelId = '';
        this.addingRelated.set(false);
      },
      error: (err) => {
        this.addingRelated.set(false);
        this.relatedError.set(
          err?.error?.error?.message || err?.error?.message || 'No se pudo agregar la obra.',
        );
      },
    });
  }

  removeRelated(novelId: string): void {
    const c = this.community();
    if (!c) return;
    this.service.removeRelatedNovel(c.slug, novelId).subscribe({
      next: (updated) => this.community.set(updated),
    });
  }

  loadForums(slug: string): void {
    this.forumsLoading.set(true);
    this.forumsService.listForums(slug).subscribe({
      next: (list) => {
        this.forums.set(list);
        this.forumsLoading.set(false);
      },
      error: () => {
        this.forums.set([]);
        this.forumsLoading.set(false);
      },
    });
    this.forumsService.listDiscussedThreads(slug, 5).subscribe({
      next: (list) => this.discussedThreads.set(list),
      error: () => this.discussedThreads.set([]),
    });
  }

  onForumChanged(updated: CommunityForum): void {
    this.forums.update((list) => list.map((f) => (f.id === updated.id ? updated : f)));
  }

  openCreateForum(): void {
    const c = this.community();
    if (!c) return;
    this.dialog
      .open(CreateForumDialogComponent, { data: { communitySlug: c.slug } })
      .afterClosed()
      .subscribe((created: CommunityForum | undefined) => {
        if (created) {
          this.forums.update((list) => [...list, created]);
        }
      });
  }

  loadCatalog(slug: string): void {
    this.catalogLoading.set(true);
    this.charactersService.list(slug, { status: 'ACTIVE' }).subscribe({
      next: (list) => {
        this.catalog.set(list);
        this.catalogLoading.set(false);
      },
      error: () => {
        this.catalog.set([]);
        this.catalogLoading.set(false);
      },
    });
    if (this.canModerateCatalog()) {
      this.charactersService.listSuggestions(slug).subscribe({
        next: (list) => this.suggestions.set(list),
        error: () => this.suggestions.set([]),
      });
    }
  }

  openSuggestCharacter(): void {
    const c = this.community();
    if (!c) return;
    this.dialog
      .open(SuggestCharacterDialogComponent, {
        data: { communityName: c.name, mode: 'suggest' },
      })
      .afterClosed()
      .subscribe((result: SuggestCharacterDialogResult | undefined) => {
        if (!result) return;
        this.charactersService.suggest(c.slug, result).subscribe({
          next: () => {
            // Stays in SUGGESTED, not in public catalog.
          },
        });
      });
  }

  openCreateCharacter(): void {
    const c = this.community();
    if (!c) return;
    this.dialog
      .open(SuggestCharacterDialogComponent, {
        data: { communityName: c.name, mode: 'create' },
      })
      .afterClosed()
      .subscribe((result: SuggestCharacterDialogResult | undefined) => {
        if (!result) return;
        this.charactersService.create(c.slug, result).subscribe({
          next: (created) => {
            this.catalog.update((list) => [...list, created]);
          },
        });
      });
  }

  editCharacter(character: CommunityCharacter): void {
    const c = this.community();
    if (!c) return;
    this.dialog
      .open(SuggestCharacterDialogComponent, {
        data: {
          communityName: c.name,
          mode: 'edit',
          initial: {
            name: character.name,
            description: character.description,
            avatarUrl: character.avatarUrl,
          },
        },
      })
      .afterClosed()
      .subscribe((result: SuggestCharacterDialogResult | undefined) => {
        if (!result) return;
        this.charactersService.update(c.slug, character.id, result).subscribe({
          next: (updated) => {
            this.catalog.update((list) => list.map((cc) => (cc.id === updated.id ? updated : cc)));
          },
        });
      });
  }

  deleteCharacter(character: CommunityCharacter): void {
    const c = this.community();
    if (!c) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar personaje',
          description: `¿Eliminar "${character.name}" del catálogo?`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.charactersService.delete(c.slug, character.id).subscribe({
          next: () => {
            this.catalog.update((list) => list.filter((cc) => cc.id !== character.id));
          },
        });
      });
  }

  approveSuggestion(s: CommunityCharacter): void {
    const c = this.community();
    if (!c) return;
    this.charactersService.approve(c.slug, s.id).subscribe({
      next: (updated) => {
        this.suggestions.update((list) => list.filter((x) => x.id !== s.id));
        this.catalog.update((list) => [...list, updated]);
      },
    });
  }

  rejectSuggestion(s: CommunityCharacter): void {
    const c = this.community();
    if (!c) return;
    this.dialog
      .open(RejectCharacterDialogComponent)
      .afterClosed()
      .subscribe((note: string | undefined) => {
        if (!note) return;
        this.charactersService.reject(c.slug, s.id, note).subscribe({
          next: () => {
            this.suggestions.update((list) => list.filter((x) => x.id !== s.id));
          },
        });
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
