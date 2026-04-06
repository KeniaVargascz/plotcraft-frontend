import { Component, input, output } from '@angular/core';
import { WbEntrySummary } from '../../../../core/models/wb-entry.model';

@Component({
  selector: 'app-wb-entry-card',
  standalone: true,
  imports: [],
  template: `
    <article class="entry-card" data-testid="wb-entry-card" (click)="select.emit(entry())">
      <div
        class="cover"
        [style.background]="
          entry().coverUrl
            ? 'url(' + entry().coverUrl + ') center/cover no-repeat'
            : 'linear-gradient(135deg, ' +
              (entry().category.color || '#2a2a3e') +
              '22, ' +
              (entry().category.color || '#2a2a3e') +
              '55)'
        "
      >
        @if (!entry().coverUrl && entry().category.icon) {
          <span class="cover-icon">{{ entry().category.icon }}</span>
        }
        @if (!entry().isPublic) {
          <span class="visibility-badge">Privado</span>
        }
      </div>
      <div class="body">
        <div class="cat-row">
          @if (entry().category.icon) {
            <span class="cat-icon">{{ entry().category.icon }}</span>
          }
          <span class="cat-name">{{ entry().category.name }}</span>
        </div>
        <h3 class="name">{{ entry().name }}</h3>
        @if (entry().summary) {
          <p class="summary">{{ entry().summary }}</p>
        }
        @if (entry().tags.length) {
          <div class="tags-row">
            @for (tag of entry().tags.slice(0, 2); track tag) {
              <span class="tag-chip">{{ tag }}</span>
            }
            @if (entry().tags.length > 2) {
              <span class="tag-chip more">+{{ entry().tags.length - 2 }}</span>
            }
          </div>
        }
      </div>
      @if (showActions()) {
        <div class="actions-row">
          <button type="button" class="action-btn" (click)="onEdit($event)">Editar</button>
          <button type="button" class="action-btn danger" (click)="onDelete($event)">
            Eliminar
          </button>
        </div>
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .entry-card {
        display: grid;
        grid-template-rows: auto 1fr auto;
        height: 100%;
        border-radius: 1.25rem;
        overflow: hidden;
        border: 1px solid var(--border);
        background: var(--bg-card);
        cursor: pointer;
        transition: box-shadow 0.2s;
      }
      .entry-card:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }
      .cover {
        position: relative;
        height: 6rem;
        display: grid;
        place-items: center;
      }
      .cover-icon {
        font-size: 2rem;
      }
      .visibility-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.5);
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.65rem;
        font-weight: 600;
      }
      .body {
        padding: 0.85rem 1rem;
        display: grid;
        gap: 0.35rem;
        align-content: start;
      }
      .cat-row {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.7rem;
        color: var(--text-3);
      }
      .cat-icon {
        font-size: 0.8rem;
      }
      .name {
        margin: 0;
        font-size: 0.95rem;
        color: var(--text-1);
        font-weight: 600;
      }
      .summary {
        margin: 0;
        color: var(--text-2);
        font-size: 0.8rem;
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .tags-row {
        display: flex;
        gap: 0.3rem;
        flex-wrap: wrap;
        margin-top: 0.15rem;
      }
      .tag-chip {
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        font-size: 0.65rem;
      }
      .tag-chip.more {
        background: var(--accent-glow);
        color: var(--accent-text);
        border: none;
      }
      .actions-row {
        display: flex;
        gap: 0.5rem;
        padding: 0.6rem 1rem 0.8rem;
        border-top: 1px solid var(--border);
      }
      .action-btn {
        flex: 1;
        padding: 0.45rem 0.6rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.75rem;
        cursor: pointer;
      }
      .action-btn:hover {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .action-btn.danger:hover {
        background: #b42318;
        color: #fff;
      }
    `,
  ],
})
export class WbEntryCardComponent {
  readonly entry = input.required<WbEntrySummary>();
  readonly showActions = input(false);

  readonly edit = output<WbEntrySummary>();
  readonly delete = output<WbEntrySummary>();
  readonly select = output<WbEntrySummary>();

  onEdit(event: Event) {
    event.stopPropagation();
    this.edit.emit(this.entry());
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.delete.emit(this.entry());
  }
}
