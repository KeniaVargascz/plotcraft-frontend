import { Component, input, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WbCategory } from '../../../core/models/wb-category.model';
import { FieldDefinition } from '../../../core/models/field-definition.model';
import { WorldbuildingService } from '../../../core/services/worldbuilding.service';
import { WbFieldSchemaBuilderComponent } from './components/wb-field-schema-builder.component';

const COLOR_SWATCHES = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6b7280',
  '#78716c',
  '#ffffff',
];

@Component({
  selector: 'app-wb-category-form-dialog',
  standalone: true,
  imports: [FormsModule, WbFieldSchemaBuilderComponent],
  template: `
    @if (visible()) {
      <div class="overlay" (click)="close()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>{{ category() ? 'Editar categoria' : 'Nueva categoria' }}</h2>
            <button type="button" class="close-btn" (click)="close()">&#10005;</button>
          </div>

          <form class="dialog-body" (ngSubmit)="submit()">
            <label>
              <span>Nombre</span>
              <input type="text" [(ngModel)]="name" name="name" required />
            </label>

            <label>
              <span>Icono (emoji)</span>
              <input
                type="text"
                [(ngModel)]="icon"
                name="icon"
                placeholder="ej: &#128081;"
                maxlength="4"
              />
            </label>

            <div class="color-section">
              <span class="label-text">Color</span>
              <div class="color-swatches">
                @for (c of swatches; track c) {
                  <button
                    type="button"
                    class="swatch"
                    [class.active]="color === c"
                    [style.background]="c"
                    (click)="color = c"
                  ></button>
                }
              </div>
              <input type="text" [(ngModel)]="color" name="color" placeholder="#6366f1" />
            </div>

            <label>
              <span>Descripcion</span>
              <textarea [(ngModel)]="description" name="description" rows="3"></textarea>
            </label>

            <div class="divider"></div>

            @if (category()?.isSystem) {
              <p class="system-note">
                Esta es una categoria del sistema. Los campos base son de solo lectura.
              </p>
            }

            <app-wb-field-schema-builder
              [fieldSchema]="fieldSchema()"
              (fieldSchemaChange)="onFieldSchemaChange($event)"
            />

            @if (errorMsg()) {
              <p class="error-msg">{{ errorMsg() }}</p>
            }

            <div class="dialog-actions">
              <button type="button" class="secondary" (click)="close()" [disabled]="saving()">
                Cancelar
              </button>
              <button type="submit" [disabled]="saving() || !name.trim()">
                {{ saving() ? 'Guardando...' : category() ? 'Guardar cambios' : 'Crear categoria' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        display: grid;
        place-items: center;
        z-index: 1000;
        padding: 1rem;
        overflow-y: auto;
      }
      .dialog {
        width: 100%;
        max-width: 36rem;
        max-height: 90vh;
        overflow-y: auto;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
      }
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        border-bottom: 1px solid var(--border);
      }
      .dialog-header h2 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-1);
      }
      .close-btn {
        width: 2rem;
        height: 2rem;
        border: none;
        border-radius: 999px;
        background: var(--bg-surface);
        color: var(--text-2);
        cursor: pointer;
        font-size: 0.85rem;
        display: grid;
        place-items: center;
      }
      .close-btn:hover {
        color: var(--text-1);
      }
      .dialog-body {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
      }
      .dialog-body label {
        display: grid;
        gap: 0.35rem;
      }
      .dialog-body label span,
      .label-text {
        font-size: 0.82rem;
        color: var(--text-2);
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
      }
      input:focus,
      textarea:focus {
        outline: 1px solid var(--accent-glow);
      }
      .color-section {
        display: grid;
        gap: 0.4rem;
      }
      .color-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .swatch {
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 999px;
        border: 2px solid transparent;
        cursor: pointer;
      }
      .swatch.active {
        border-color: var(--text-1);
        box-shadow: 0 0 0 2px var(--accent-glow);
      }
      .divider {
        border-top: 1px solid var(--border);
      }
      .system-note {
        color: var(--text-3);
        font-size: 0.82rem;
        margin: 0;
        font-style: italic;
      }
      .error-msg {
        color: #b42318;
        font-size: 0.82rem;
        margin: 0;
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding-top: 0.5rem;
      }
      .dialog-actions button {
        padding: 0.7rem 1.1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.85rem;
        cursor: pointer;
      }
      .secondary {
        background: transparent !important;
        color: var(--text-1) !important;
      }
      .dialog-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class WbCategoryFormDialogComponent {
  private readonly wbService = inject(WorldbuildingService);

  readonly worldSlug = input.required<string>();
  readonly category = input<WbCategory | null>(null);
  readonly visible = signal(false);
  readonly saving = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly fieldSchema = signal<FieldDefinition[]>([]);

  readonly saved = output<WbCategory>();

  readonly swatches = COLOR_SWATCHES;

  name = '';
  icon = '';
  color = '#6366f1';
  description = '';

  open(cat?: WbCategory | null) {
    if (cat) {
      this.name = cat.name;
      this.icon = cat.icon || '';
      this.color = cat.color || '#6366f1';
      this.description = cat.description || '';
      this.fieldSchema.set(cat.fieldSchema ? [...cat.fieldSchema] : []);
    } else {
      this.name = '';
      this.icon = '';
      this.color = '#6366f1';
      this.description = '';
      this.fieldSchema.set([]);
    }
    this.errorMsg.set(null);
    this.visible.set(true);
  }

  close() {
    this.visible.set(false);
  }

  onFieldSchemaChange(schema: FieldDefinition[]) {
    this.fieldSchema.set(schema);
  }

  submit() {
    if (this.saving() || !this.name.trim()) return;
    this.saving.set(true);
    this.errorMsg.set(null);

    const payload = {
      name: this.name.trim(),
      icon: this.icon.trim() || null,
      color: this.color.trim() || null,
      description: this.description.trim() || null,
      fieldSchema: this.fieldSchema(),
    };

    const cat = this.category();
    const request = cat
      ? this.wbService.updateCategory(this.worldSlug(), cat.slug, payload)
      : this.wbService.createCategory(this.worldSlug(), payload);

    request.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.saved.emit(result);
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.errorMsg.set('No se pudo guardar la categoria.');
      },
    });
  }
}
