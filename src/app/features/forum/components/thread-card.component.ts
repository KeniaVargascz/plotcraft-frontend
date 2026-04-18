import { Component, computed, input, output } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThreadSummary } from '../../../core/models/forum-thread.model';
import { CategoryBadgeComponent } from './category-badge.component';

@Component({
  selector: 'app-thread-card',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, CategoryBadgeComponent],
  template: `
    <article class="card" [class.pinned]="thread().isPinned">
      <div class="card-header">
        <app-category-badge [category]="thread().category" />
        @if (thread().isPinned) {
          <span class="badge pin-badge"
            ><svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="17" x2="12" y2="22" />
              <path
                d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"
              />
            </svg>
            Fijado</span
          >
        }
        @if (thread().status === 'CLOSED') {
          <span class="badge closed-badge"
            ><svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            No acepta respuestas</span
          >
        }
        @if (thread().status === 'ARCHIVED') {
          <span class="badge archived-badge"
            ><svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            Archivado</span
          >
        }
      </div>

      <a class="title" [routerLink]="['/foro', thread().slug]">
        {{ thread().title }}
      </a>

      @if (thread().tags.length) {
        <div class="tags">
          @for (tag of visibleTags(); track tag) {
            <span class="tag">#{{ tag }}</span>
          }
          @if (thread().tags.length > 3) {
            <span class="tag more">+{{ thread().tags.length - 3 }}</span>
          }
        </div>
      }

      <footer class="footer">
        <div class="author">
          @if (thread().author.avatarUrl) {
            <img
              [src]="thread().author.avatarUrl"
              [alt]="thread().author.username"
              class="avatar"
              loading="lazy"
            />
          } @else {
            <span class="avatar placeholder">{{ thread().author.username[0] | uppercase }}</span>
          }
          <span class="username">{{
            thread().author.displayName || thread().author.username
          }}</span>
          <span class="time">{{ relativeTime() }}</span>
        </div>

        <div class="stats">
          <span title="Respuestas"
            ><svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {{ thread().stats.repliesCount }}</span
          >
          <span title="Reacciones"
            ><svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
            {{ thread().stats.reactionsCount }}</span
          >
          <span title="Vistas"
            ><svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {{ thread().viewsCount }}</span
          >
          @if (thread().stats.hasSolution) {
            <span class="solution-badge"
              ><svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Solucionado</span
            >
          } @else if (thread().stats.repliesCount > 0) {
            <span class="unsolved-badge"
              ><svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Sin solucion</span
            >
          }
          @if (thread().stats.hasPoll) {
            @if (thread().status === 'CLOSED') {
              <span class="poll-closed-badge"
                ><svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Encuesta cerrada</span
              >
            } @else {
              <span class="poll-badge"
                ><svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Encuesta abierta</span
              >
            }
          }
        </div>
      </footer>

      @if (showArchiveBtn()) {
        <div class="card-actions">
          @if (thread().status === 'ARCHIVED') {
            <button
              type="button"
              class="action-btn restore-action"
              (click)="restore.emit(thread())"
            >
              Restaurar hilo
            </button>
          } @else {
            <button
              type="button"
              class="action-btn archive-action"
              (click)="archive.emit(thread())"
            >
              Archivar hilo
            </button>
          }
        </div>
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1rem 1.25rem;
        transition: border-color 0.2s;
      }
      .card:hover {
        border-color: var(--accent);
      }
      .card.pinned {
        border-left: 3px solid var(--accent);
      }
      .card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
      }
      .pin-badge {
        background: var(--accent);
        color: #fff;
      }
      .closed-badge {
        background: var(--danger);
        color: #fff;
      }
      .archived-badge {
        background: var(--bg-surface);
        color: var(--text-3);
      }
      .title {
        display: block;
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--text-1);
        text-decoration: none;
        margin-bottom: 0.35rem;
        line-height: 1.4;
      }
      .title:hover {
        color: var(--accent);
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-bottom: 0.65rem;
      }
      .tag {
        font-size: 0.75rem;
        color: var(--accent);
        background: var(--bg-surface);
        padding: 0.15rem 0.5rem;
        border-radius: 0.5rem;
      }
      .tag.more {
        color: var(--text-3);
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        color: var(--text-2);
      }
      .author {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .avatar {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        object-fit: cover;
      }
      .avatar.placeholder {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--accent);
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
      }
      .username {
        font-weight: 500;
      }
      .time {
        color: var(--text-3);
      }
      .stats {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .stats span {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .solution-badge {
        color: #16a34a;
        font-weight: 600;
        font-size: 0.72rem;
        background: rgba(22, 163, 74, 0.1);
        padding: 0.1rem 0.45rem;
        border-radius: 0.4rem;
      }
      .unsolved-badge {
        color: var(--text-3);
        font-size: 0.72rem;
        padding: 0.1rem 0.45rem;
        border-radius: 0.4rem;
        background: var(--bg-surface);
      }
      .poll-badge {
        color: #3b82f6;
        font-weight: 600;
        font-size: 0.72rem;
        background: rgba(59, 130, 246, 0.1);
        padding: 0.1rem 0.45rem;
        border-radius: 0.4rem;
      }
      .card-actions {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--border);
      }
      .action-btn {
        background: none;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        padding: 0.3rem 0.75rem;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.15s;
      }
      .archive-action {
        color: var(--text-3);
      }
      .archive-action:hover {
        border-color: var(--danger);
        color: var(--danger);
      }
      .restore-action {
        color: var(--accent-text);
      }
      .restore-action:hover {
        border-color: var(--accent);
        background: var(--accent-glow);
      }
      .poll-closed-badge {
        color: var(--text-3);
        font-weight: 600;
        font-size: 0.72rem;
        background: var(--bg-surface);
        padding: 0.1rem 0.45rem;
        border-radius: 0.4rem;
      }
    `,
  ],
})
export class ThreadCardComponent {
  readonly thread = input.required<ThreadSummary>();
  readonly showArchiveBtn = input(false);
  readonly archive = output<ThreadSummary>();
  readonly restore = output<ThreadSummary>();

  readonly visibleTags = computed(() => this.thread().tags.slice(0, 3));

  readonly relativeTime = computed(() => {
    const date = new Date(this.thread().createdAt);
    const now = Date.now();
    const diff = now - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days}d`;
    const months = Math.floor(days / 30);
    if (months < 12) return `hace ${months}mes`;
    return `hace ${Math.floor(months / 12)}a`;
  });
}
