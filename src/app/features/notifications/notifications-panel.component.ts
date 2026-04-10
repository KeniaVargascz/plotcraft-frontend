import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNotification } from '../../core/models/notification.model';
import { NotificationsService } from '../../core/services/notifications.service';
import { NotificationItemComponent } from './components/notification-item.component';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [RouterLink, NotificationItemComponent],
  template: `
    <div class="panel-backdrop" (click)="close.emit()"></div>
    <div class="panel" (click)="$event.stopPropagation()">
      <div class="panel-header">
        <h3>Notificaciones</h3>
        <button class="mark-read-btn" type="button" (click)="markAllRead()">
          Marcar todas como leidas
        </button>
      </div>

      <div class="panel-body">
        @if (loading()) {
          <p class="empty">Cargando...</p>
        } @else if (notifications().length === 0) {
          <p class="empty">No tienes notificaciones aun.</p>
        } @else {
          @for (n of notifications(); track n.id) {
            <app-notification-item
              [notification]="n"
              (clicked)="onNotificationClick($event)"
              (deleted)="onDelete($event)"
            />
          }
        }
      </div>

      <div class="panel-footer">
        <a routerLink="/notificaciones" (click)="close.emit()">Ver todas</a>
      </div>
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: var(--z-overlay);
    }
    .panel-backdrop {
      position: fixed;
      inset: 0;
      z-index: calc(var(--z-overlay) - 1);
    }
    .panel {
      position: relative;
      z-index: var(--z-overlay);
      width: min(380px, calc(100vw - 2rem));
      max-height: min(480px, calc(100vh - 7rem));
      display: flex;
      flex-direction: column;
      background: var(--surface-overlay, var(--bg-card, #161524));
      border: 1px solid var(--color-border, rgba(201, 168, 76, 0.12));
      border-radius: 1rem;
      box-shadow: var(--shadow-overlay);
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .panel-header h3 {
      margin: 0;
      font-size: 1rem;
    }
    .mark-read-btn {
      background: none;
      border: none;
      color: var(--accent);
      font-size: 0.82rem;
      cursor: pointer;
    }
    .mark-read-btn:hover {
      text-decoration: underline;
    }
    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 0.35rem 0;
    }
    .empty {
      text-align: center;
      color: var(--text-3);
      padding: 2rem 1rem;
      margin: 0;
    }
    .panel-footer {
      border-top: 1px solid var(--border);
      padding: 0.65rem 1rem;
      text-align: center;
    }
    .panel-footer a {
      color: var(--accent);
      text-decoration: none;
      font-size: 0.88rem;
    }
    .panel-footer a:hover {
      text-decoration: underline;
    }
    @media (max-width: 767px) {
      :host {
        right: auto;
        left: 50%;
        transform: translateX(-50%);
      }
      .panel {
        margin-top: 0.75rem;
      }
    }
  `,
})
export class NotificationsPanelComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);

  readonly visible = input<boolean>(false);
  readonly close = output<void>();
  readonly badgeReset = output<void>();

  readonly notifications = signal<AppNotification[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.loading.set(true);
    this.notificationsService.list({ limit: 10 }).subscribe({
      next: (res) => {
        this.notifications.set(res.data);
        this.loading.set(false);
        this.notificationsService.markAllAsRead().subscribe(() => {
          this.badgeReset.emit();
        });
      },
      error: () => this.loading.set(false),
    });
  }

  markAllRead(): void {
    this.notificationsService.markAllAsRead().subscribe(() => {
      this.notifications.update((list) =>
        list.map((n) => ({ ...n, isRead: true })),
      );
      this.badgeReset.emit();
    });
  }

  onNotificationClick(n: AppNotification): void {
    if (!n.isRead) {
      this.notificationsService.markAsRead(n.id).subscribe();
      this.notifications.update((list) =>
        list.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
      );
    }
    if (n.url) {
      window.location.href = n.url;
    }
    this.close.emit();
  }

  onDelete(n: AppNotification): void {
    this.notificationsService.remove(n.id).subscribe(() => {
      this.notifications.update((list) => list.filter((item) => item.id !== n.id));
    });
  }
}
