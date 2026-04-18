import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { COMMUNITY_TYPE_LABELS, Community } from './models/community.model';
import { CommunityService } from './services/community.service';

@Component({
  selector: 'app-admin-communities-page',
  standalone: true,
  imports: [DatePipe, FormsModule, LoadingSpinnerComponent],
  template: `
    <section class="page">
      <header class="header">
        <h1>Revisión de comunidades</h1>
        <span class="count">{{ items().length }} pendiente(s)</span>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (!items().length) {
        <p class="empty">No hay solicitudes pendientes. 🎉</p>
      } @else {
        <ul class="list">
          @for (c of items(); track c.id) {
            <li class="item">
              <div class="meta">
                <strong>{{ c.name }}</strong>
                <span class="type">{{ typeLabel(c) }}</span>
                <span class="date">{{ c.createdAt | date: 'short' }}</span>
              </div>
              @if (c.owner) {
                <div class="owner">
                  <div class="avatar">
                    @if (c.owner.avatarUrl) {
                      <img [src]="c.owner.avatarUrl" [alt]="c.owner.displayName" loading="lazy" />
                    } @else {
                      <span>{{ c.owner.displayName.charAt(0) }}</span>
                    }
                  </div>
                  <span>{{ c.owner.displayName }} (&#64;{{ c.owner.username }})</span>
                </div>
              }
              @if (c.description) {
                <p class="desc">{{ c.description }}</p>
              }
              <div class="actions">
                <button type="button" class="approve" (click)="approve(c)">✓ Aprobar</button>
                <button type="button" class="reject" (click)="openReject(c)">✗ Rechazar</button>
              </div>

              @if (rejectingId() === c.id) {
                <div class="reject-form">
                  <h4>Motivo del rechazo</h4>
                  <textarea [(ngModel)]="rejectReason" rows="3"></textarea>
                  <div class="reject-actions">
                    <button type="button" (click)="cancelReject()">Cancelar</button>
                    <button
                      type="button"
                      class="reject"
                      [disabled]="!rejectReason.trim()"
                      (click)="confirmReject(c)"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              }
            </li>
          }
        </ul>
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
      }
      .header h1 {
        margin: 0;
      }
      .count {
        padding: 0.3rem 0.7rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.85rem;
        font-weight: 700;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 1rem;
      }
      .item {
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        display: grid;
        gap: 0.6rem;
      }
      .meta {
        display: flex;
        gap: 0.75rem;
        align-items: baseline;
        flex-wrap: wrap;
      }
      .type {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.7rem;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-weight: 700;
        text-transform: uppercase;
      }
      .date {
        color: var(--text-3);
        font-size: 0.8rem;
      }
      .owner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-2);
        font-size: 0.9rem;
      }
      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--bg-surface);
        overflow: hidden;
        display: grid;
        place-items: center;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .desc {
        margin: 0;
        color: var(--text-2);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
      }
      .actions button {
        padding: 0.5rem 0.95rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
        font-weight: 600;
      }
      .approve {
        background: rgba(77, 184, 138, 0.2) !important;
        color: #63d4a2 !important;
        border-color: transparent !important;
      }
      .reject {
        background: rgba(214, 90, 90, 0.2) !important;
        color: #e49d9d !important;
        border-color: transparent !important;
      }
      .reject-form {
        padding: 0.85rem;
        border-radius: 0.75rem;
        background: var(--bg-surface);
        display: grid;
        gap: 0.6rem;
      }
      .reject-form h4 {
        margin: 0;
      }
      .reject-form textarea {
        padding: 0.55rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        font: inherit;
      }
      .reject-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .empty {
        text-align: center;
        color: var(--text-2);
      }
    `,
  ],
})
export class AdminCommunitiesPageComponent implements OnInit {
  private readonly service = inject(CommunityService);

  readonly items = signal<Community[]>([]);
  readonly loading = signal(true);
  readonly rejectingId = signal<string | null>(null);
  rejectReason = '';

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.service.getPendingCommunities().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  typeLabel(c: Community): string {
    return COMMUNITY_TYPE_LABELS[c.type];
  }

  approve(c: Community): void {
    this.service.approveCommunity(c.slug).subscribe({
      next: () => this.items.update((l) => l.filter((x) => x.id !== c.id)),
    });
  }

  openReject(c: Community): void {
    this.rejectingId.set(c.id);
    this.rejectReason = '';
  }

  cancelReject(): void {
    this.rejectingId.set(null);
    this.rejectReason = '';
  }

  confirmReject(c: Community): void {
    if (!this.rejectReason.trim()) return;
    this.service.rejectCommunity(c.slug, this.rejectReason.trim()).subscribe({
      next: () => {
        this.items.update((l) => l.filter((x) => x.id !== c.id));
        this.cancelReject();
      },
    });
  }
}
