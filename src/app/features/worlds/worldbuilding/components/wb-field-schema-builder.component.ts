import { ChangeDetectionStrategy, Component, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldDefinition, FieldType } from '../../../../core/models/field-definition.model';

type FieldPropValue = FieldDefinition[keyof FieldDefinition];

@Component({
  selector: 'app-wb-field-schema-builder',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="schema-builder">
      <div class="header-row">
        <h4>Campos personalizados</h4>
        <button type="button" class="add-btn" (click)="addField()">+ Agregar campo</button>
      </div>

      @if (error()) {
        <p class="error-msg">{{ error() }}</p>
      }

      @for (field of fields(); track $index) {
        <div class="field-block" [class.expanded]="expandedIndex() === $index">
          <div class="field-summary" (click)="toggleExpand($index)">
            <span class="field-key">{{ field.label || 'Sin nombre' }}</span>
            <span class="field-type-badge">{{ field.type }}</span>
            @if (field.required) {
              <span class="required-badge">Requerido</span>
            }
            <span class="expand-icon">{{
              expandedIndex() === $index ? '&#9650;' : '&#9660;'
            }}</span>
          </div>

          @if (expandedIndex() === $index) {
            <div class="field-detail">
              <label>
                <span>Clave (key)</span>
                <input
                  type="text"
                  [ngModel]="field.key"
                  (ngModelChange)="updateFieldKey($index, $event)"
                  placeholder="ej: population"
                />
                <span class="hint"
                  >Solo letras minusculas y guion bajo. Se convierte automaticamente.</span
                >
              </label>
              <label>
                <span>Etiqueta</span>
                <input
                  type="text"
                  [ngModel]="field.label"
                  (ngModelChange)="updateFieldLabel($index, $event)"
                  placeholder="ej: Poblacion"
                />
              </label>
              <label>
                <span>Tipo</span>
                <select
                  [ngModel]="field.type"
                  (ngModelChange)="updateFieldProp($index, 'type', $event)"
                >
                  @for (t of fieldTypes; track t) {
                    <option [value]="t">{{ t }}</option>
                  }
                </select>
              </label>
              <label class="toggle-label">
                <input
                  type="checkbox"
                  [ngModel]="field.required"
                  (ngModelChange)="updateFieldProp($index, 'required', $event)"
                />
                <span>Requerido</span>
              </label>
              <label>
                <span>Placeholder</span>
                <input
                  type="text"
                  [ngModel]="field.placeholder"
                  (ngModelChange)="updateFieldProp($index, 'placeholder', $event)"
                  placeholder="Texto de ayuda"
                />
              </label>
              @if (field.type === 'select' || field.type === 'multiselect') {
                <label>
                  <span>Opciones (separadas por coma)</span>
                  <input
                    type="text"
                    [ngModel]="(field.options || []).join(', ')"
                    (ngModelChange)="updateFieldOptions($index, $event)"
                    placeholder="opcion1, opcion2, opcion3"
                  />
                </label>
              }
              <div class="field-actions">
                @if ($index > 0) {
                  <button type="button" class="move-btn" (click)="moveField($index, -1)">
                    &#8593; Subir
                  </button>
                }
                @if ($index < fields().length - 1) {
                  <button type="button" class="move-btn" (click)="moveField($index, 1)">
                    &#8595; Bajar
                  </button>
                }
                <button type="button" class="remove-btn" (click)="removeField($index)">
                  Eliminar campo
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (!fields().length) {
        <p class="empty-msg">No hay campos definidos. Agrega uno para empezar.</p>
      }
    </div>
  `,
  styles: [
    `
      .schema-builder {
        display: grid;
        gap: 0.75rem;
      }
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header-row h4 {
        margin: 0;
        color: var(--text-1);
        font-size: 0.95rem;
      }
      .add-btn {
        padding: 0.45rem 0.85rem;
        border-radius: 0.75rem;
        border: 1px dashed var(--border);
        background: transparent;
        color: var(--accent-text);
        font-size: 0.78rem;
        cursor: pointer;
      }
      .add-btn:hover {
        background: var(--bg-surface);
      }
      .error-msg {
        color: #b42318;
        font-size: 0.8rem;
        margin: 0;
      }
      .field-block {
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        overflow: hidden;
      }
      .field-block.expanded {
        border-color: var(--accent-glow);
      }
      .field-summary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 0.85rem;
        cursor: pointer;
        background: var(--bg-surface);
      }
      .field-summary:hover {
        background: var(--bg-card);
      }
      .field-key {
        flex: 1;
        font-size: 0.85rem;
        color: var(--text-1);
        font-weight: 500;
      }
      .field-type-badge {
        padding: 0.12rem 0.4rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.65rem;
        font-weight: 600;
      }
      .required-badge {
        padding: 0.12rem 0.4rem;
        border-radius: 999px;
        background: #b4231822;
        color: #b42318;
        font-size: 0.65rem;
      }
      .expand-icon {
        color: var(--text-3);
        font-size: 0.7rem;
      }
      .field-detail {
        display: grid;
        gap: 0.65rem;
        padding: 0.85rem;
        background: var(--bg-card);
      }
      .field-detail label {
        display: grid;
        gap: 0.3rem;
      }
      .field-detail label span {
        font-size: 0.78rem;
        color: var(--text-2);
      }
      .field-detail input,
      .field-detail select {
        padding: 0.55rem 0.75rem;
        border-radius: 0.65rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.82rem;
      }
      .toggle-label {
        flex-direction: row !important;
        display: flex !important;
        align-items: center;
        gap: 0.5rem;
      }
      .toggle-label input[type='checkbox'] {
        width: 1rem;
        height: 1rem;
      }
      .field-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        padding-top: 0.5rem;
        border-top: 1px solid var(--border);
      }
      .move-btn,
      .remove-btn {
        padding: 0.35rem 0.65rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text-2);
        font-size: 0.75rem;
        cursor: pointer;
      }
      .move-btn:hover {
        background: var(--bg-surface);
      }
      .remove-btn {
        color: #b42318;
        border-color: #b4231844;
        margin-left: auto;
      }
      .remove-btn:hover {
        background: #b4231811;
      }
      .hint {
        font-size: 0.7rem;
        color: var(--text-3);
        font-style: italic;
      }
      .empty-msg {
        color: var(--text-3);
        font-size: 0.82rem;
        text-align: center;
        margin: 0;
        padding: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WbFieldSchemaBuilderComponent {
  readonly fieldSchema = input<FieldDefinition[]>([]);
  readonly fieldSchemaChange = output<FieldDefinition[]>();

  readonly fields = signal<FieldDefinition[]>([]);
  readonly expandedIndex = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  readonly fieldTypes: FieldType[] = [
    'text',
    'textarea',
    'number',
    'select',
    'multiselect',
    'boolean',
    'url',
    'markdown',
  ];

  private initialized = false;

  constructor() {
    effect(() => {
      const schema = this.fieldSchema();
      if (schema && schema.length && !this.initialized) {
        this.initialized = true;
        this.fields.set([...schema]);
      }
    });
  }

  toggleExpand(index: number) {
    this.expandedIndex.set(this.expandedIndex() === index ? null : index);
  }

  addField() {
    const newField: FieldDefinition = {
      key: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: null,
      options: null,
      default: null,
      sortOrder: this.fields().length,
    };
    this.fields.update((f) => [...f, newField]);
    this.expandedIndex.set(this.fields().length - 1);
    this.emitChange();
  }

  removeField(index: number) {
    this.fields.update((f) => f.filter((_, i) => i !== index));
    this.expandedIndex.set(null);
    this.error.set(null);
    this.emitChange();
  }

  private toSnakeCase(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  }

  updateFieldKey(index: number, value: string) {
    const snakeKey = this.toSnakeCase(value);
    this.fields.update((f) => {
      const updated = [...f];
      updated[index] = { ...updated[index], key: snakeKey };
      return updated;
    });
    this.validateKeys();
    this.emitChange();
  }

  updateFieldLabel(index: number, value: string) {
    this.fields.update((f) => {
      const updated = [...f];
      const field = updated[index];
      const keyWasAuto = !field.key || field.key === this.toSnakeCase(field.label);
      updated[index] = {
        ...field,
        label: value,
        ...(keyWasAuto ? { key: this.toSnakeCase(value) } : {}),
      };
      return updated;
    });
    this.validateKeys();
    this.emitChange();
  }

  updateFieldProp(index: number, prop: keyof FieldDefinition, value: FieldPropValue) {
    this.fields.update((f) => {
      const updated = [...f];
      updated[index] = { ...updated[index], [prop]: value };
      return updated;
    });
    this.validateKeys();
    this.emitChange();
  }

  updateFieldOptions(index: number, raw: string) {
    const options = raw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    this.fields.update((f) => {
      const updated = [...f];
      updated[index] = { ...updated[index], options };
      return updated;
    });
    this.emitChange();
  }

  moveField(index: number, direction: number) {
    const target = index + direction;
    if (target < 0 || target >= this.fields().length) return;
    this.fields.update((f) => {
      const updated = [...f];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated.map((field, i) => ({ ...field, sortOrder: i }));
    });
    this.expandedIndex.set(target);
    this.emitChange();
  }

  private validateKeys() {
    const keys = this.fields()
      .map((f) => f.key)
      .filter(Boolean);
    const unique = new Set(keys);
    if (keys.length !== unique.size) {
      this.error.set('Las claves de los campos deben ser unicas.');
    } else {
      this.error.set(null);
    }
  }

  private emitChange() {
    this.fieldSchemaChange.emit(this.fields());
  }
}
