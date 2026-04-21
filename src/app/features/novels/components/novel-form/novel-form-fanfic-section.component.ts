import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Community } from '../../../communities/models/community.model';

@Component({
  selector: 'app-novel-form-fanfic-section',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="full">
      <legend>Comunidad fandom</legend>
      @if (isEdit) {
        <p class="hint">
          {{ linkedCommunityName || 'Sin comunidad' }} ·
          <em>La comunidad no se puede cambiar tras la creación.</em>
        </p>
      } @else {
        @if (myFandoms.length > 0) {
          <select
            [ngModel]="linkedCommunityId"
            (ngModelChange)="onCommunitySelect($event)"
            [disabled]="disabled || !!customFandom.trim()"
          >
            <option [ngValue]="''">Selecciona una comunidad Fandom</option>
            @for (com of myFandoms; track com.id) {
              <option [ngValue]="com.id">{{ com.name }}</option>
            }
          </select>
        }
        @if (!linkedCommunityId) {
          <label class="custom-fandom">
            <span>O escribe el nombre del fandom (se guardará como tag):</span>
            <input
              type="text"
              [(ngModel)]="customFandom"
              [disabled]="disabled"
              maxlength="80"
              placeholder="Ejemplo: Jujutsu Kaisen"
            />
          </label>
        }
        <p class="hint">
          ¿No se encuentra el fandom al que pertenece tu fanfiction?
          <a routerLink="/mis-comunidades" [queryParams]="{ nueva: 1 }"
            >Agrégalo en Comunidades</a
          >.
        </p>
        @if (validationError) {
          <p class="error">{{ validationError }}</p>
        }
      }
    </fieldset>

    <fieldset class="full">
      <legend>Relacion con mundos</legend>
      <label class="check-row">
        <input
          type="checkbox"
          [checked]="isAlternateUniverse"
          [disabled]="disabled"
          (change)="onAuToggle()"
        />
        Esta novela es un AU (Universo Alternativo)
      </label>
      <p class="hint">
        Si activas esta opcion, podras vincular este fanfic a uno de tus mundos propios.
      </p>
    </fieldset>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .full {
        grid-column: 1 / -1;
      }
      fieldset {
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        padding: 0.85rem;
      }
      legend {
        color: var(--text-2);
        font-size: 0.88rem;
        font-weight: 600;
        padding: 0 0.35rem;
      }
      select,
      input {
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.75rem 0.9rem;
      }
      select:focus,
      input:focus {
        outline: none;
        border-color: var(--accent);
      }
      input::placeholder {
        color: var(--text-3);
      }
      label {
        color: var(--text-2);
      }
      .hint {
        margin: 0;
        color: var(--text-2);
      }
      .hint a {
        color: var(--accent-text);
        text-decoration: none;
      }
      .hint a:hover {
        color: var(--accent);
      }
      .error {
        margin: 0;
        color: var(--danger);
      }
    `,
  ],
})
export class NovelFormFanficSectionComponent {
  @Input() myFandoms: Community[] = [];
  @Input() linkedCommunityId = '';
  @Input() linkedCommunityName = '';
  @Input() isEdit = false;
  @Input() isAlternateUniverse = false;
  @Input() validationError: string | null = null;
  @Input() disabled = false;
  @Output() communityChange = new EventEmitter<string>();
  @Output() alternateUniverseChange = new EventEmitter<boolean>();

  customFandom = '';

  onCommunitySelect(communityId: string): void {
    this.communityChange.emit(communityId);
  }

  onAuToggle(): void {
    this.alternateUniverseChange.emit(!this.isAlternateUniverse);
  }

  /** Returns the current custom fandom text for the parent to use during save */
  getCustomFandom(): string {
    return this.customFandom.trim();
  }
}
