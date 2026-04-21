import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogWarningItem } from '../../../../core/models/warning.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-novel-form-warnings-selector',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="full genres">
      <legend>{{ 'novel.warnings.title' | translate }}</legend>
      <div class="genre-picker">
        <select
          [disabled]="disabled || !availableWarnings.length"
          [ngModel]="''"
          (ngModelChange)="onSelect($event)"
        >
          <option value="" disabled>
            @if (!availableWarnings.length) {
              No quedan advertencias por agregar
            } @else {
              Seleccionar advertencia
            }
          </option>
          @for (w of availableWarnings; track w.id) {
            <option [value]="w.id">{{ w.label }}</option>
          }
        </select>
        @if (selectedWarningIds.length) {
          <ul class="picked-list warning-list">
            @for (id of selectedWarningIds; track id) {
              <li>
                {{ getWarningLabel(id) }}
                <button
                  type="button"
                  class="icon"
                  [disabled]="disabled"
                  aria-label="Quitar advertencia"
                  (click)="onToggle(id)"
                >
                  ✕
                </button>
              </li>
            }
          </ul>
        }
      </div>
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
      .genres {
        display: grid;
        gap: 0.5rem;
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
      select {
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.75rem 0.9rem;
        width: 100%;
      }
      select:focus {
        outline: none;
        border-color: var(--accent);
      }
      .genre-picker {
        display: flex;
        flex-direction: column-reverse;
        gap: 0.5rem;
      }
      .picked-list {
        list-style: none;
        margin: 0.5rem 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .picked-list li {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        background: var(--accent-glow);
        border: 1px solid var(--border-s);
        color: var(--accent-text);
        font-size: 0.78rem;
      }
      .picked-list .icon {
        background: transparent;
        border: 0;
        padding: 0;
        cursor: pointer;
        color: inherit;
        font-size: 0.78rem;
        min-height: unset;
        opacity: 0.7;
      }
      .picked-list .icon:hover {
        opacity: 1;
      }
      .warning-list li {
        background: color-mix(in srgb, var(--danger) 12%, transparent);
        border-color: color-mix(in srgb, var(--danger) 24%, transparent);
        color: var(--danger);
      }
    `,
  ],
})
export class NovelFormWarningsSelectorComponent {
  @Input() allWarnings: CatalogWarningItem[] = [];
  @Input() selectedWarningIds: string[] = [];
  @Input() disabled = false;
  @Output() warningsChange = new EventEmitter<string[]>();

  get availableWarnings(): CatalogWarningItem[] {
    return this.allWarnings.filter((w) => !this.selectedWarningIds.includes(w.id));
  }

  getWarningLabel(id: string): string {
    return this.allWarnings.find((w) => w.id === id)?.label ?? id;
  }

  onSelect(id: string): void {
    if (id && !this.selectedWarningIds.includes(id)) {
      this.warningsChange.emit([...this.selectedWarningIds, id]);
    }
  }

  onToggle(id: string): void {
    this.warningsChange.emit(
      this.selectedWarningIds.includes(id)
        ? this.selectedWarningIds.filter((v) => v !== id)
        : [...this.selectedWarningIds, id],
    );
  }
}
