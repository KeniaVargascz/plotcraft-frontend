import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CommunityCardComponent } from './components/community-card/community-card.component';
import { Community } from './models/community.model';
import { CommunityService } from './services/community.service';

@Component({
  selector: 'app-followed-communities-page',
  standalone: true,
  imports: [RouterLink, CommunityCardComponent],
  template: `
    <section class="page">
      <header class="header">
        <div>
          <h1>Comunidades</h1>
          <p>Las comunidades a las que perteneces o sigues.</p>
        </div>
        <a class="primary" routerLink="/comunidades/explorar">Explorar todas las comunidades</a>
      </header>

      @if (loading()) {
        <p class="muted">Cargando comunidades…</p>
      } @else if (!isAuth()) {
        <p class="empty">Inicia sesión para ver tus comunidades.</p>
      } @else if (!items().length) {
        <div class="empty-state">
          <p>Aún no perteneces ni sigues ninguna comunidad.</p>
          <a class="primary" routerLink="/comunidades/explorar">Explorar comunidades</a>
        </div>
      } @else {
        <div class="grid">
          @for (c of items(); track c.id) {
            <app-community-card [community]="c" />
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .header h1 {
        margin: 0 0 0.25rem;
      }
      .header p {
        margin: 0;
        color: var(--text-2);
      }
      .primary {
        padding: 0.7rem 1.2rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        text-decoration: none;
        font-weight: 600;
        border: 0;
        cursor: pointer;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }
      .empty,
      .muted {
        color: var(--text-2);
        text-align: center;
      }
      .empty-state {
        display: grid;
        gap: 1rem;
        justify-items: center;
        padding: 2rem;
        border: 1px dashed var(--border);
        border-radius: 1rem;
        color: var(--text-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowedCommunitiesPageComponent implements OnInit {
  private readonly service = inject(CommunityService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<Community[]>([]);
  readonly loading = signal(true);

  isAuth(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    if (!this.isAuth()) {
      this.loading.set(false);
      return;
    }
    forkJoin({
      member: this.service.getMyCommunities().pipe(catchError(() => of([] as Community[]))),
      followed: this.service
        .getMyFollowedCommunities()
        .pipe(catchError(() => of([] as Community[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ member, followed }) => {
      const map = new Map<string, Community>();
      for (const c of [...member, ...followed]) {
        if (c.status !== 'ACTIVE') continue;
        if (!map.has(c.id)) map.set(c.id, c);
      }
      this.items.set(Array.from(map.values()));
      this.loading.set(false);
    });
  }
}
