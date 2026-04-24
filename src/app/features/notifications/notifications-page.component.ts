import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AppNotification } from '../../core/models/notification.model';
import { NotificationsService } from '../../core/services/notifications.service';
import { NotificationItemComponent } from './components/notification-item.component';

type FilterChip = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [NotificationItemComponent],
  template: `
    <section class="notifications-page">
      <header class="page-header">
        <h1>Notificaciones</h1>
        <div class="header-actions">
          <button class="action-btn" type="button" (click)="markAllRead()">
            Marcar todas como leidas
          </button>
          <button class="action-btn danger" type="button" (click)="deleteAll()">
            Eliminar todas
          </button>
        </div>
      </header>

      <div class="filter-chips">
        @for (chip of chips; track chip.value) {
          <button
            class="chip"
            [class.active]="activeFilter() === chip.value"
            type="button"
            (click)="setFilter(chip.value)"
          >
            {{ chip.label }}
          </button>
        }
      </div>

      <div class="notif-list">
        @if (loading()) {
          <p class="empty">Cargando notificaciones...</p>
        } @else if (notifications().length === 0) {
          <p class="empty">No hay notificaciones para mostrar.</p>
        } @else {
          @for (n of notifications(); track n.id) {
            <app-notification-item
              [notification]="n"
              (clicked)="onNotificationClick($event)"
              (deleted)="onDelete($event)"
            />
          }

          @if (hasMore()) {
            <div class="load-more">
              <button class="action-btn" type="button" [disabled]="loading()" (click)="loadMore()">
                {{ loading() ? 'Cargando...' : 'Cargar mas' }}
              </button>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: `
    .notifications-page {
      max-width: 720px;
      margin: 0 auto;
      display: grid;
      gap: 1.25rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-header h1 {
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 0.65rem;
    }
    .action-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.65rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-1);
      cursor: pointer;
      font-size: 0.88rem;
    }
    .action-btn:hover {
      background: var(--bg-surface);
    }
    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .action-btn.danger {
      border-color: color-mix(in srgb, var(--danger) 45%, var(--border));
      color: var(--danger);
    }
    .action-btn.danger:hover {
      background: color-mix(in srgb, var(--danger) 12%, var(--bg-card));
    }
    .filter-chips {
      display: flex;
      gap: 0.5rem;
    }
    .chip {
      padding: 0.45rem 0.95rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-2);
      cursor: pointer;
      font-size: 0.85rem;
    }
    .chip.active {
      background: var(--accent-glow);
      color: var(--accent-text);
      border-color: var(--accent);
    }
    .notif-list {
      display: grid;
      gap: 0.25rem;
      border: 1px solid var(--border);
      border-radius: 1rem;
      background: var(--bg-card);
      padding: 0.5rem;
    }
    .empty {
      text-align: center;
      color: var(--text-3);
      padding: 2.5rem 1rem;
      margin: 0;
    }
    .load-more {
      text-align: center;
      padding: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly chips: { value: FilterChip; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'unread', label: 'No leidas' },
    { value: 'read', label: 'Leidas' },
  ];

  readonly notifications = signal<AppNotification[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  readonly activeFilter = signal<FilterChip>('all');
  private cursor: string | null = null;

  ngOnInit(): void {
    this.loadNotifications(true);
  }

  setFilter(filter: FilterChip): void {
    this.activeFilter.set(filter);
    this.cursor = null;
    this.loadNotifications(true);
  }

  loadMore(): void {
    this.loadNotifications(false);
  }

  markAllRead(): void {
    this.notificationsService.markAllAsRead().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
    });
  }

  deleteAll(): void {
    this.notificationsService.removeAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.notifications.set([]);
      this.hasMore.set(false);
      this.cursor = null;
    });
  }

  onNotificationClick(n: AppNotification): void {
    if (!n.isRead) {
      this.notificationsService.markAsRead(n.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      this.notifications.update((list) =>
        list.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
      );
    }
    if (n.url) {
      this.router.navigateByUrl(n.url);
    }
  }

  onDelete(n: AppNotification): void {
    this.notificationsService.remove(n.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.notifications.update((list) => list.filter((item) => item.id !== n.id));
    });
  }

  private loadNotifications(reset: boolean): void {
    this.loading.set(true);
    const filter = this.activeFilter();
    const isRead = filter === 'unread' ? false : filter === 'read' ? true : null;

    this.notificationsService
      .list({ cursor: reset ? null : this.cursor, limit: 20, isRead })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (reset) {
            this.notifications.set(res.data);
          } else {
            this.notifications.update((prev) => [...prev, ...res.data]);
          }
          this.cursor = res.pagination?.nextCursor ?? null;
          this.hasMore.set(res.pagination?.hasMore ?? false);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          if (reset) {
            this.notifications.set([]);
          }
        },
      });
  }
}
