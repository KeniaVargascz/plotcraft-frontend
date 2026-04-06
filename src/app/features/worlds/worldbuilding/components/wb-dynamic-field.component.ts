import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldDefinition, FieldValue } from '../../../../core/models/field-definition.model';
import { MarkdownService } from '../../../../core/services/markdown.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-wb-dynamic-field',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="field-wrapper">
      <label class="field-label">
        {{ fieldDef().label }}
        @if (fieldDef().required) {
          <span class="required">*</span>
        }
      </label>

      @switch (fieldDef().type) {
        @case ('text') {
          <input
            type="text"
            [placeholder]="fieldDef().placeholder || ''"
            [ngModel]="value()"
            (ngModelChange)="onValueChange($event)"
          />
        }
        @case ('textarea') {
          <textarea
            rows="4"
            [placeholder]="fieldDef().placeholder || ''"
            [ngModel]="value()"
            (ngModelChange)="onValueChange($event)"
          ></textarea>
        }
        @case ('number') {
          <input
            type="number"
            [placeholder]="fieldDef().placeholder || ''"
            [ngModel]="value()"
            (ngModelChange)="onValueChange($event)"
          />
        }
        @case ('select') {
          <select [ngModel]="value()" (ngModelChange)="onValueChange($event)">
            <option [ngValue]="null">-- Seleccionar --</option>
            @for (opt of fieldDef().options || []; track opt) {
              <option [value]="opt">{{ opt }}</option>
            }
          </select>
        }
        @case ('multiselect') {
          <select multiple [ngModel]="value() || []" (ngModelChange)="onValueChange($event)">
            @for (opt of fieldDef().options || []; track opt) {
              <option [value]="opt">{{ opt }}</option>
            }
          </select>
        }
        @case ('boolean') {
          <label class="toggle-row">
            <input type="checkbox" [ngModel]="value()" (ngModelChange)="onValueChange($event)" />
            <span class="toggle-text">{{ value() ? 'Si' : 'No' }}</span>
          </label>
        }
        @case ('url') {
          <input
            type="url"
            [placeholder]="fieldDef().placeholder || 'https://...'"
            [ngModel]="value()"
            (ngModelChange)="onValueChange($event)"
          />
        }
        @case ('markdown') {
          <div class="md-wrapper">
            <div class="md-tabs">
              <button
                type="button"
                class="md-tab"
                [class.active]="!showPreview()"
                (click)="showPreview.set(false)"
              >
                Editar
              </button>
              <button
                type="button"
                class="md-tab"
                [class.active]="showPreview()"
                (click)="showPreview.set(true)"
              >
                Vista previa
              </button>
            </div>
            @if (!showPreview()) {
              <textarea
                rows="6"
                [placeholder]="fieldDef().placeholder || 'Escribe en Markdown...'"
                [ngModel]="value()"
                (ngModelChange)="onValueChange($event)"
              ></textarea>
            } @else {
              <div class="md-preview" [innerHTML]="renderMarkdown(asMarkdown(value()))"></div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .field-wrapper {
        display: grid;
        gap: 0.4rem;
      }
      .field-label {
        font-size: 0.82rem;
        color: var(--text-2);
        font-weight: 500;
      }
      .required {
        color: #b42318;
      }
      input,
      textarea,
      select {
        padding: 0.7rem 0.85rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.85rem;
        width: 100%;
        box-sizing: border-box;
      }
      input:focus,
      textarea:focus,
      select:focus {
        outline: 1px solid var(--accent-glow);
      }
      select[multiple] {
        min-height: 5rem;
      }
      .toggle-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }
      .toggle-row input[type='checkbox'] {
        width: 1.1rem;
        height: 1.1rem;
        accent-color: var(--accent-text);
      }
      .toggle-text {
        font-size: 0.85rem;
        color: var(--text-1);
      }
      .md-wrapper {
        display: grid;
        gap: 0;
      }
      .md-tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid var(--border);
      }
      .md-tab {
        padding: 0.45rem 0.85rem;
        border: none;
        background: transparent;
        color: var(--text-3);
        font-size: 0.78rem;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }
      .md-tab.active {
        color: var(--accent-text);
        border-bottom-color: var(--accent-text);
      }
      .md-preview {
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 0 0 0.75rem 0.75rem;
        background: var(--bg-surface);
        min-height: 6rem;
        font-size: 0.85rem;
        color: var(--text-1);
        line-height: 1.6;
      }
    `,
  ],
})
export class WbDynamicFieldComponent {
  private readonly markdownService = inject(MarkdownService);

  readonly fieldDef = input.required<FieldDefinition>();
  readonly value = input<FieldValue>(null);
  readonly valueChange = output<FieldValue>();
  readonly showPreview = signal(false);

  onValueChange(newValue: FieldValue) {
    this.valueChange.emit(newValue);
  }

  asMarkdown(value: FieldValue): string {
    return typeof value === 'string' ? value : '';
  }

  renderMarkdown(text: string): string {
    return this.markdownService.render(text);
  }
}
