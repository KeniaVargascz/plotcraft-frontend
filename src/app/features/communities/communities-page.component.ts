import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CommunityCardComponent } from './components/community-card/community-card.component';
import { Community, CommunityType } from './models/community.model';
import { CommunityService } from './services/community.service';

@Component({
  selector: 'app-communities-page',
  standalone: true,
  imports: [FormsModule, RouterLink, CommunityCardComponent],
  template: `
    <section class="page">
      <header class="header">
        <div>
          <h1>Comunidades</h1>
          <p>Descubre y únete a comunidades de lectores y autores.</p>
        </div>
        @if (isAuth()) {
          <a class="primary" routerLink="/comunidades/nueva">Crear comunidad</a>
        }
      </header>

      <div class="filters">
        <input
          type="text"
          placeholder="Buscar comunidades…"
          [(ngModel)]="searchValue"
          (ngModelChange)="onSearchChange($event)"
        />
        <select [(ngModel)]="typeValue" (ngModelChange)="onTypeChange($event)">
          <option value="">Todas</option>
          <option value="PUBLIC">Pública</option>
          <option value="PRIVATE">Privada</option>
          <option value="FANDOM">Fandom</option>
        </select>
      </div>

      @if (loading() && !items().length) {
        <div class="grid">
          @for (n of skeletons; track n) {
            <div class="skeleton"></div>
          }
        </div>
      } @else if (!items().length) {
        <p class="empty">No hay comunidades para mostrar.</p>
      } @else {
        <div class="grid">
          @for (c of items(); track c.id) {
            <app-community-card [community]="c" />
          }
        </div>
        @if (hasMore()) {
          <div class="more">
            <button type="button" (click)="loadMore()" [disabled]="loading()">
              {{ loading() ? 'Cargando…' : 'Cargar más' }}
            </button>
          </div>
        }
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
      }
      .filters {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .filters input,
      .filters select {
        padding: 0.6rem 0.85rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
      }
      .filters input {
        flex: 1;
        min-width: 200px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }
      .skeleton {
        height: 280px;
        border-radius: 1rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        animation: pulse 1.4s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
      }
      .empty {
        color: var(--text-2);
        text-align: center;
      }
      .more {
        display: flex;
        justify-content: center;
      }
      .more button {
        padding: 0.65rem 1.2rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
      }
    `,
  ],
})
export class CommunitiesPageComponent implements OnInit, OnDestroy {
  private readonly service = inject(CommunityService);
  private readonly authService = inject(AuthService);

  readonly items = signal<Community[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  private cursor: string | null = null;

  searchValue = '';
  typeValue: '' | CommunityType = '';
  readonly skeletons = Array(6).fill(0);

  private readonly search$ = new Subject<string>();
  private sub?: Subscription;

  isAuth(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    this.sub = this.search$.pipe(debounceTime(400)).subscribe(() => this.reload());
    this.reload();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSearchChange(_: string): void {
    this.search$.next(this.searchValue);
  }

  onTypeChange(_: string): void {
    this.reload();
  }

  private reload(): void {
    this.cursor = null;
    this.items.set([]);
    this.fetch();
  }

  loadMore(): void {
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.service
      .getCommunities({
        cursor: this.cursor,
        limit: 12,
        type: this.typeValue || null,
        search: this.searchValue || null,
      })
      .subscribe({
        next: (res) => {
          this.items.update((list) => [...list, ...res.data]);
          this.cursor = res.pagination.nextCursor;
          this.hasMore.set(res.pagination.hasMore);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
