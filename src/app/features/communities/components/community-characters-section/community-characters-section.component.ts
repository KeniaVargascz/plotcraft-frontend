import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommunityCharacter } from '../../models/community-character.model';
import { CommunityCharacterCardComponent } from '../community-character-card/community-character-card.component';

@Component({
  selector: 'app-community-characters-section',
  standalone: true,
  imports: [CommunityCharacterCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="block">
      <div class="catalog-head">
        <h2>Cat&aacute;logo de personajes</h2>
        @if (canSuggest) {
          <button type="button" class="action-btn" (click)="suggestClick.emit()">
            + Sugerir personaje
          </button>
        }
        @if (canModerate) {
          <button type="button" class="action-btn" (click)="createClick.emit()">
            + Nuevo personaje
          </button>
        }
      </div>
      @if (loading) {
        <p class="muted">Cargando cat&aacute;logo...</p>
      } @else if (!characters.length) {
        <p class="muted">Este fandom a&uacute;n no tiene personajes en su cat&aacute;logo.</p>
      } @else {
        <div class="catalog-grid">
          @for (cc of characters; track cc.id) {
            <app-community-character-card
              [character]="cc"
              [canManage]="canModerate"
              (edit)="editClick.emit($event)"
              (remove)="deleteClick.emit($event)"
            />
          }
        </div>
      }

      @if (canModerate) {
        <div class="suggestions-block">
          <h3>
            Sugerencias pendientes
            @if (suggestions.length) {
              <span class="badge">{{ suggestions.length }}</span>
            }
          </h3>
          @if (!suggestions.length) {
            <p class="muted">No hay sugerencias pendientes.</p>
          } @else {
            <ul class="suggestions-list">
              @for (s of suggestions; track s.id) {
                <li class="suggestion-row">
                  <div class="avatar">
                    @if (s.avatarUrl) {
                      <img [src]="s.avatarUrl" [alt]="s.name" loading="lazy" />
                    } @else {
                      <span>{{ s.name.charAt(0) }}</span>
                    }
                  </div>
                  <div class="sg-info">
                    <strong>{{ s.name }}</strong>
                    @if (s.description) {
                      <p>{{ s.description }}</p>
                    }
                    @if (s.suggestedBy) {
                      <small>Sugerido por &#64;{{ s.suggestedBy.username }}</small>
                    }
                  </div>
                  <div class="sg-actions">
                    <button type="button" class="ok" (click)="approveClick.emit(s)">
                      &#x2713; Aprobar
                    </button>
                    <button type="button" class="ko" (click)="rejectClick.emit(s)">
                      &#x2717; Rechazar
                    </button>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .block {
        margin-bottom: 1.5rem;
      }
      .block h2 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
      }
      .muted {
        color: var(--text-3);
      }
      .catalog-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .catalog-head h2 {
        margin: 0;
        flex: 1;
      }
      .action-btn {
        padding: 0.45rem 0.85rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--accent-glow);
        color: var(--accent-text);
        cursor: pointer;
        font-weight: 600;
      }
      .catalog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 0.75rem;
        margin-top: 0.75rem;
      }
      .suggestions-block {
        margin-top: 1.25rem;
        padding-top: 1rem;
        border-top: 1px dashed var(--border);
      }
      .suggestions-block h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
      }
      .suggestions-block .badge {
        background: var(--accent-glow);
        color: var(--accent-text);
        padding: 0.1rem 0.55rem;
        border-radius: 999px;
        font-size: 0.75rem;
      }
      .suggestions-list {
        list-style: none;
        margin: 0.5rem 0 0;
        padding: 0;
        display: grid;
        gap: 0.5rem;
      }
      .suggestion-row {
        display: grid;
        grid-template-columns: 48px 1fr auto;
        gap: 0.6rem;
        padding: 0.6rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--bg-surface);
        align-items: center;
      }
      .suggestion-row .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--bg-card);
        display: grid;
        place-items: center;
      }
      .suggestion-row .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .sg-info p {
        margin: 0.15rem 0;
        color: var(--text-2);
        font-size: 0.85rem;
      }
      .sg-info small {
        color: var(--text-3);
        font-size: 0.75rem;
      }
      .sg-actions {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }
      .sg-actions button {
        padding: 0.35rem 0.7rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
        font-size: 0.78rem;
      }
      .sg-actions .ok {
        color: #6fcf97;
      }
      .sg-actions .ko {
        color: #ff8b8b;
      }
    `,
  ],
})
export class CommunityCharactersSectionComponent {
  @Input() characters: CommunityCharacter[] = [];
  @Input() suggestions: CommunityCharacter[] = [];
  @Input() loading = false;
  @Input() canModerate = false;
  @Input() canSuggest = false;

  @Output() suggestClick = new EventEmitter<void>();
  @Output() createClick = new EventEmitter<void>();
  @Output() editClick = new EventEmitter<CommunityCharacter>();
  @Output() deleteClick = new EventEmitter<CommunityCharacter>();
  @Output() approveClick = new EventEmitter<CommunityCharacter>();
  @Output() rejectClick = new EventEmitter<CommunityCharacter>();
}
