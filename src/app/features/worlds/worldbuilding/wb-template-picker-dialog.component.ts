import { Component, input, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryTemplate, WbCategory } from '../../../core/models/wb-category.model';
import { WorldbuildingService } from '../../../core/services/worldbuilding.service';

@Component({
  selector: 'app-wb-template-picker-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (visible()) {
      <div class="overlay" (click)="close()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>{{ selectedTemplate() ? 'Configurar plantilla' : 'Elegir plantilla' }}</h2>
            <button type="button" class="close-btn" (click)="close()">&#10005;</button>
          </div>

          <div class="dialog-body">
            @if (!selectedTemplate()) {
              @if (loading()) {
                <p class="state">Cargando plantillas...</p>
              } @else {
                <div class="templates-grid">
                  @for (tpl of templates(); track tpl.key) {
                    <button type="button" class="template-card" (click)="selectTemplate(tpl)">
                      <span class="tpl-icon">{{ tpl.icon }}</span>
                      <span class="tpl-name">{{ tpl.name }}</span>
                      <span class="tpl-desc">{{ tpl.description }}</span>
                      <span class="tpl-fields">{{ tpl.fieldSchema.length }} campos</span>
                    </button>
                  }
                </div>
                @if (!templates().length) {
                  <p class="state">No hay plantillas disponibles.</p>
                }
              }
            } @else {
              <form (ngSubmit)="submitTemplate()">
                <div class="tpl-preview">
                  <span class="tpl-preview-icon">{{ overrideIcon || selectedTemplate()!.icon }}</span>
                  <div>
                    <p class="tpl-preview-name">{{ selectedTemplate()!.name }}</p>
                    <p class="tpl-preview-desc">{{ selectedTemplate()!.description }}</p>
                  </div>
                </div>

                <div class="fields-preview">
                  <h4>Campos incluidos:</h4>
                  <div class="field-pills">
                    @for (field of selectedTemplate()!.fieldSchema; track field.key) {
                      <span class="field-pill">{{ field.label }} ({{ field.type }})</span>
                    }
                  </div>
                </div>

                <label>
                  <span>Nombre (opcional, override)</span>
                  <input type="text" [(ngModel)]="overrideName" name="overrideName" [placeholder]="selectedTemplate()!.name" />
                </label>
                <label>
                  <span>Icono (opcional)</span>
                  <input type="text" [(ngModel)]="overrideIcon" name="overrideIcon" [placeholder]="selectedTemplate()!.icon" maxlength="4" />
                </label>
                <label>
                  <span>Color (opcional)</span>
                  <input type="text" [(ngModel)]="overrideColor" name="overrideColor" [placeholder]="selectedTemplate()!.color" />
                </label>

                @if (errorMsg()) {
                  <p class="error-msg">{{ errorMsg() }}</p>
                }

                <div class="dialog-actions">
                  <button type="button" class="secondary" (click)="selectedTemplate.set(null)" [disabled]="saving()">Volver</button>
                  <button type="submit" [disabled]="saving()">
                    {{ saving() ? 'Creando...' : 'Crear desde plantilla' }}
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      display: grid;
      place-items: center;
      z-index: 1000;
      padding: 1rem;
      overflow-y: auto;
    }
    .dialog {
      width: 100%;
      max-width: 42rem;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 1.25rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
      box-shadow: 0 24px 48px rgba(0,0,0,0.2);
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    .dialog-header h2 { margin: 0; font-size: 1.1rem; color: var(--text-1); }
    .close-btn {
      width: 2rem; height: 2rem;
      border: none; border-radius: 999px;
      background: var(--bg-surface); color: var(--text-2);
      cursor: pointer; display: grid; place-items: center;
    }
    .dialog-body { padding: 1.25rem; display: grid; gap: 1rem; }
    .state { color: var(--text-3); text-align: center; }
    .templates-grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    }
    .template-card {
      display: grid;
      gap: 0.3rem;
      padding: 1rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }
    .template-card:hover {
      border-color: var(--accent-glow);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .tpl-icon { font-size: 1.6rem; }
    .tpl-name { font-size: 0.9rem; font-weight: 600; color: var(--text-1); }
    .tpl-desc { font-size: 0.75rem; color: var(--text-2); line-height: 1.4; }
    .tpl-fields {
      font-size: 0.68rem;
      color: var(--accent-text);
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: var(--accent-glow);
      width: fit-content;
    }
    .tpl-preview {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem;
      border-radius: 0.75rem;
      background: var(--bg-surface);
    }
    .tpl-preview-icon { font-size: 2rem; }
    .tpl-preview-name { margin: 0; font-weight: 600; color: var(--text-1); }
    .tpl-preview-desc { margin: 0; font-size: 0.8rem; color: var(--text-2); }
    .fields-preview h4 { margin: 0; font-size: 0.85rem; color: var(--text-2); }
    .field-pills { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .field-pill {
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      font-size: 0.7rem;
      color: var(--text-2);
    }
    form { display: grid; gap: 0.85rem; }
    label { display: grid; gap: 0.3rem; }
    label span { font-size: 0.82rem; color: var(--text-2); }
    input {
      padding: 0.65rem 0.85rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-1);
      font-size: 0.85rem;
    }
    input:focus { outline: 1px solid var(--accent-glow); }
    .error-msg { color: #b42318; font-size: 0.82rem; margin: 0; }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
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
    .secondary { background: transparent !important; color: var(--text-1) !important; }
    .dialog-actions button:disabled { opacity: 0.5; }
  `],
})
export class WbTemplatePickerDialogComponent {
  private readonly wbService = inject(WorldbuildingService);

  readonly worldSlug = input.required<string>();
  readonly visible = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly templates = signal<CategoryTemplate[]>([]);
  readonly selectedTemplate = signal<CategoryTemplate | null>(null);

  readonly created = output<WbCategory>();

  overrideName = '';
  overrideIcon = '';
  overrideColor = '';

  open() {
    this.selectedTemplate.set(null);
    this.overrideName = '';
    this.overrideIcon = '';
    this.overrideColor = '';
    this.errorMsg.set(null);
    this.visible.set(true);
    this.loadTemplates();
  }

  close() {
    this.visible.set(false);
  }

  selectTemplate(tpl: CategoryTemplate) {
    this.selectedTemplate.set(tpl);
    this.overrideName = '';
    this.overrideIcon = '';
    this.overrideColor = '';
  }

  submitTemplate() {
    const tpl = this.selectedTemplate();
    if (!tpl || this.saving()) return;
    this.saving.set(true);
    this.errorMsg.set(null);

    const payload: any = { templateKey: tpl.key };
    if (this.overrideName.trim()) payload.name = this.overrideName.trim();
    if (this.overrideIcon.trim()) payload.icon = this.overrideIcon.trim();
    if (this.overrideColor.trim()) payload.color = this.overrideColor.trim();

    this.wbService.instantiateTemplate(this.worldSlug(), payload).subscribe({
      next: (cat) => {
        this.saving.set(false);
        this.created.emit(cat);
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.errorMsg.set('No se pudo crear la categoria desde la plantilla.');
      },
    });
  }

  private loadTemplates() {
    this.loading.set(true);
    this.wbService.listTemplates().subscribe({
      next: (tpls) => {
        this.templates.set(tpls);
        this.loading.set(false);
      },
      error: () => {
        this.templates.set([]);
        this.loading.set(false);
      },
    });
  }
}
