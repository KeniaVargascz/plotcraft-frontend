import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReaderPreferences } from '../../../../core/models/reader.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reader-preferences-panel',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="panel prefs-panel">
      <div class="prefs-header">
        <h3>{{ 'reader.preferences.title' | translate }}</h3>
        <button
          type="button"
          class="prefs-close"
          aria-label="Cerrar"
          (click)="closed.emit()"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <label>
        {{ 'reader.preferences.font' | translate }}
        <select
          [value]="preferences().font_family"
          (change)="preferencesChange.emit({ font_family: $any($event.target).value })"
        >
          <option value="crimson">{{ 'reader.preferences.fonts.crimson' | translate }}</option>
          <option value="outfit">{{ 'reader.preferences.fonts.outfit' | translate }}</option>
          <option value="georgia">{{ 'reader.preferences.fonts.georgia' | translate }}</option>
          <option value="mono">{{ 'reader.preferences.fonts.mono' | translate }}</option>
        </select>
      </label>
      <label>
        {{ 'reader.preferences.fontSize' | translate }}
        <input
          type="range"
          min="14"
          max="26"
          [value]="preferences().font_size"
          (input)="preferencesChange.emit({ font_size: +$any($event.target).value })"
          data-testid="font-size-slider"
        />
      </label>
      <label>
        {{ 'reader.preferences.lineHeight' | translate }}
        <input
          type="range"
          min="1.4"
          max="2.4"
          step="0.1"
          [value]="preferences().line_height"
          (input)="preferencesChange.emit({ line_height: +$any($event.target).value })"
        />
      </label>
      <label>
        {{ 'reader.preferences.mode' | translate }}
        <select
          [value]="preferences().reading_mode"
          (change)="preferencesChange.emit({ reading_mode: $any($event.target).value })"
        >
          <option value="scroll">{{ 'reader.preferences.modeScroll' | translate }}</option>
          <option value="paginated">{{ 'reader.preferences.modePaginated' | translate }}</option>
        </select>
      </label>
      <label class="toggle">
        <input
          type="checkbox"
          [checked]="preferences().show_progress"
          (change)="preferencesChange.emit({ show_progress: $any($event.target).checked })"
        />
        {{ 'reader.preferences.showProgress' | translate }}
      </label>
    </aside>
  `,
  styles: [
    `
      .panel {
        width: min(300px, 100%);
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1.5rem;
      }
      .prefs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .prefs-header h3 {
        margin: 0;
      }
      .prefs-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        min-height: 32px;
        padding: 0;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        cursor: pointer;
      }
      .prefs-close:hover {
        color: var(--accent-text);
        border-color: var(--accent-text);
      }
      button,
      select,
      input {
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.5rem 0.8rem;
      }
      select,
      input[type='range'],
      input[type='checkbox'] {
        accent-color: var(--accent-text);
      }
      select:focus,
      input:focus {
        outline: 2px solid var(--accent-text);
        outline-offset: 2px;
      }
      input[type='range'] {
        padding: 0;
        border: 0;
        background: transparent;
      }
      input[type='range']::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 2px;
        background: var(--border);
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-text);
        margin-top: -6px;
        cursor: pointer;
      }
      input[type='range']::-moz-range-track {
        height: 4px;
        border-radius: 2px;
        background: var(--border);
        border: 0;
      }
      input[type='range']::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-text);
        border: 0;
        cursor: pointer;
      }
      label {
        display: grid;
        gap: 0.35rem;
      }
      .toggle {
        display: flex;
        align-items: center;
      }
    `,
  ],
})
export class ReaderPreferencesPanelComponent {
  readonly preferences = input.required<ReaderPreferences>();

  readonly closed = output<void>();
  readonly preferencesChange = output<Partial<ReaderPreferences>>();
}
