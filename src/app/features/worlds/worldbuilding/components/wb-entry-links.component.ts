import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { WbEntryLink } from '../../../../core/models/wb-entry.model';

@Component({
  selector: 'app-wb-entry-links',
  standalone: true,
  imports: [],
  template: `
    <div class="links-panel">
      <div class="links-header">
        <h4>Referencias cruzadas</h4>
        @if (isOwner()) {
          <button type="button" class="add-link-btn" (click)="addLink.emit()">+ Vincular</button>
        }
      </div>

      @if (links().length) {
        <div class="links-list">
          @for (link of links(); track link.id) {
            <div class="link-item">
              <div class="link-info">
                @if (link.entry.category.icon) {
                  <span class="link-icon">{{ link.entry.category.icon }}</span>
                }
                <div class="link-text">
                  <span class="link-relation">{{ link.relation }}</span>
                  <span class="link-name">{{ link.entry.name }}</span>
                </div>
                @if (link.isMutual) {
                  <span class="mutual-badge">Mutuo</span>
                }
              </div>
              @if (isOwner()) {
                <button type="button" class="delete-link-btn" (click)="deleteLink.emit(link.id)">
                  &#10005;
                </button>
              }
            </div>
          }
        </div>
      } @else {
        <p class="empty">No hay referencias cruzadas.</p>
      }
    </div>
  `,
  styles: [
    `
      .links-panel {
        display: grid;
        gap: 0.65rem;
      }
      .links-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .links-header h4 {
        margin: 0;
        font-size: 0.92rem;
        color: var(--text-1);
      }
      .add-link-btn {
        padding: 0.35rem 0.7rem;
        border-radius: 0.65rem;
        border: 1px dashed var(--border);
        background: transparent;
        color: var(--accent-text);
        font-size: 0.75rem;
        cursor: pointer;
      }
      .add-link-btn:hover {
        background: var(--bg-surface);
      }
      .links-list {
        display: grid;
        gap: 0.35rem;
      }
      .link-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 0.7rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .link-info {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex: 1;
        min-width: 0;
      }
      .link-icon {
        font-size: 1rem;
        flex-shrink: 0;
      }
      .link-text {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        min-width: 0;
      }
      .link-relation {
        font-size: 0.7rem;
        color: var(--text-3);
      }
      .link-name {
        font-size: 0.82rem;
        color: var(--text-1);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mutual-badge {
        padding: 0.1rem 0.35rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.6rem;
        flex-shrink: 0;
      }
      .delete-link-btn {
        width: 1.6rem;
        height: 1.6rem;
        display: grid;
        place-items: center;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: var(--text-3);
        cursor: pointer;
        font-size: 0.7rem;
        flex-shrink: 0;
      }
      .delete-link-btn:hover {
        background: #b4231822;
        color: #b42318;
      }
      .empty {
        color: var(--text-3);
        font-size: 0.82rem;
        margin: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WbEntryLinksComponent {
  readonly links = input.required<WbEntryLink[]>();
  readonly isOwner = input(false);

  readonly deleteLink = output<string>();
  readonly addLink = output<void>();
}
