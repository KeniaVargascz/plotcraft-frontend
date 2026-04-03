import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MarkdownService } from '../../core/services/markdown.service';
import { WorldsService } from '../../core/services/worlds.service';
import { WorldVisibility } from '../../core/models/world.model';

@Component({
  selector: 'app-world-form-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="form-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Autor</p>
          <h1>{{ isEdit() ? 'Editar mundo' : 'Nuevo mundo' }}</h1>
          <p class="lede">Documenta ambientacion, reglas y tono general con Markdown.</p>
        </div>
        <a class="back-link" routerLink="/mis-mundos">Volver</a>
      </header>

      <form class="editor-grid" (ngSubmit)="submit()">
        <section class="card form-pane">
          <label
            ><span>Nombre</span
            ><input [(ngModel)]="name" name="name" required [disabled]="saving()"
          /></label>
          <label
            ><span>Tagline</span><input [(ngModel)]="tagline" name="tagline" [disabled]="saving()"
          /></label>
          <label
            ><span>Visibilidad</span>
            <select [(ngModel)]="visibility" name="visibility" [disabled]="saving()">
              <option value="PRIVATE">Privado</option>
              <option value="PUBLIC">Publico</option>
            </select>
          </label>
          <label
            ><span>Tags</span
            ><input
              [(ngModel)]="tagsRaw"
              name="tagsRaw"
              placeholder="fantasia, politica, magia"
              [disabled]="saving()"
          /></label>
          <label
            ><span>Descripcion</span
            ><textarea
              [(ngModel)]="description"
              name="description"
              rows="7"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
          <label
            ><span>Ambientacion</span
            ><textarea
              [(ngModel)]="setting"
              name="setting"
              rows="7"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
          <label
            ><span>Sistema de magia</span
            ><textarea
              [(ngModel)]="magicSystem"
              name="magicSystem"
              rows="7"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
          <label
            ><span>Reglas</span
            ><textarea
              [(ngModel)]="rules"
              name="rules"
              rows="7"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>

          @if (message()) {
            <p class="feedback success">{{ message() }}</p>
          }
          @if (error()) {
            <p class="feedback error">{{ error() }}</p>
          }

          <div class="actions">
            <button type="button" class="secondary" routerLink="/mis-mundos" [disabled]="saving()">
              Cancelar
            </button>
            <button type="submit" [disabled]="saving() || !name.trim()">
              {{ saving() ? 'Guardando...' : isEdit() ? 'Guardar cambios' : 'Crear mundo' }}
            </button>
          </div>
        </section>

        <aside class="card preview-pane">
          <h2>Preview</h2>
          <div [innerHTML]="previewHtml()"></div>
        </aside>
      </form>
    </section>
  `,
  styles: [
    `
      .form-shell,
      .editor-grid,
      .form-pane {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.25rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .hero {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .editor-grid {
        grid-template-columns: 1.1fr 0.9fr;
      }
      .eyebrow,
      .lede,
      label span {
        color: var(--text-2);
      }
      label {
        display: grid;
        gap: 0.45rem;
      }
      input,
      select,
      textarea,
      .actions button,
      .back-link {
        padding: 0.85rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .actions button,
      .back-link {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .secondary {
        background: transparent !important;
        color: var(--text-1) !important;
      }
      .feedback.success {
        color: #027a48;
      }
      .feedback.error {
        color: #b42318;
      }
      @media (max-width: 960px) {
        .editor-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WorldFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly worldsService = inject(WorldsService);
  private readonly markdownService = inject(MarkdownService);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly previewHtml = signal('');

  private currentSlug: string | null = null;

  name = '';
  tagline = '';
  description = '';
  setting = '';
  magicSystem = '';
  rules = '';
  tagsRaw = '';
  visibility: WorldVisibility = 'PRIVATE';

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      this.isEdit.set(Boolean(slug));
      this.currentSlug = slug;
      if (!slug) {
        this.refreshPreview();
        return;
      }

      this.worldsService.getBySlug(slug).subscribe((world) => {
        this.name = world.name;
        this.tagline = world.tagline ?? '';
        this.description = world.description ?? '';
        this.setting = world.setting ?? '';
        this.magicSystem = world.magicSystem ?? '';
        this.rules = world.rules ?? '';
        this.tagsRaw = world.tags.join(', ');
        this.visibility = world.visibility;
        this.refreshPreview();
      });
    });
  }

  submit() {
    if (this.saving() || !this.name.trim()) return;
    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    const payload = {
      name: this.name.trim(),
      tagline: this.tagline.trim() || null,
      description: this.description.trim() || null,
      setting: this.setting.trim() || null,
      magicSystem: this.magicSystem.trim() || null,
      rules: this.rules.trim() || null,
      visibility: this.visibility,
      tags: this.tagsRaw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    const request =
      this.isEdit() && this.currentSlug
        ? this.worldsService.update(this.currentSlug, payload)
        : this.worldsService.create(payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (world) => {
        this.message.set('Mundo guardado correctamente.');
        void this.router.navigate(['/mis-mundos', world.slug, 'editar']);
      },
      error: () => this.error.set('No se pudo guardar el mundo.'),
    });
  }

  refreshPreview() {
    const sections = [
      this.description && `## Descripcion\n${this.description}`,
      this.setting && `## Ambientacion\n${this.setting}`,
      this.magicSystem && `## Sistema\n${this.magicSystem}`,
      this.rules && `## Reglas\n${this.rules}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    this.previewHtml.set(this.markdownService.render(sections || 'Sin contenido todavia.'));
  }
}
