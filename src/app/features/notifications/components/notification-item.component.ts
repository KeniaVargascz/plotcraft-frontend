import { Component, input, output } from '@angular/core';
import { AppNotification, NotificationType } from '../../../core/models/notification.model';

const TYPE_ICONS: Record<NotificationType, string> = {
  NEW_FOLLOWER: '\u{1F464}',
  NEW_COMMENT: '\u{1F4AC}',
  NEW_REACTION: '\u{2764}\u{FE0F}',
  NEW_REPLY: '\u{1F5E8}\u{FE0F}',
  NEW_CHAPTER: '\u{1F4D6}',
  NOVEL_MILESTONE: '\u{1F3C6}',
  SYSTEM: '\u{1F514}',
};

@Component({
  selector: 'app-notification-item',
  standalone: true,
  template: `
    @let n = notification();
    <div class="notif-item" [class.unread]="!n.isRead" (click)="clicked.emit(n)">
      @if (!n.isRead) {
        <span class="unread-dot"></span>
      }

      <div class="notif-icon">
        @if (n.actor?.avatarUrl) {
          <img
            [src]="n.actor!.avatarUrl"
            [alt]="n.actor!.displayName || n.actor!.username"
            class="avatar"
          />
        } @else {
          <span class="type-icon">{{ iconFor(n.type) }}</span>
        }
      </div>

      <div class="notif-body">
        <p class="notif-title" [class.bold]="!n.isRead">{{ n.title }}</p>
        <p class="notif-text">{{ n.body }}</p>
        <span class="notif-time">{{ relativeTime(n.createdAt) }}</span>
      </div>

      <button class="delete-btn" type="button" title="Eliminar" (click)="onDelete($event, n)">
        &times;
      </button>
    </div>
  `,
  styles: `
    .notif-item {
      display: grid;
      grid-template-columns: auto auto 1fr auto;
      align-items: start;
      gap: 0.65rem;
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }
    .notif-item:hover {
      background: var(--bg-surface);
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      margin-top: 0.45rem;
    }
    .notif-item:not(.unread) {
      grid-template-columns: auto 1fr auto;
    }
    .notif-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }
    .type-icon {
      font-size: 1.35rem;
    }
    .notif-body {
      min-width: 0;
    }
    .notif-title {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-1);
    }
    .notif-title.bold {
      font-weight: 600;
    }
    .notif-text {
      margin: 0.15rem 0 0;
      font-size: 0.82rem;
      color: var(--text-2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .notif-time {
      font-size: 0.75rem;
      color: var(--text-3);
    }
    .delete-btn {
      background: none;
      border: none;
      color: var(--text-3);
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.25rem 0.4rem;
      border-radius: 0.4rem;
      line-height: 1;
    }
    .delete-btn:hover {
      background: color-mix(in srgb, var(--danger) 18%, var(--bg-surface));
      color: var(--danger);
    }
  `,
})
export class NotificationItemComponent {
  readonly notification = input.required<AppNotification>();
  readonly clicked = output<AppNotification>();
  readonly deleted = output<AppNotification>();

  iconFor(type: NotificationType): string {
    return TYPE_ICONS[type] ?? '\u{1F514}';
  }

  relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'ahora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days}d`;
    const months = Math.floor(days / 30);
    return `hace ${months}mes`;
  }

  onDelete(event: Event, n: AppNotification): void {
    event.stopPropagation();
    this.deleted.emit(n);
  }
}
