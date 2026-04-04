import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { NovelSummary } from '../../core/models/novel.model';
import { MarkdownService } from '../../core/services/markdown.service';
import { NovelsService } from '../../core/services/novels.service';
import { WorldsService } from '../../core/services/worlds.service';
import { WorldGenre, WorldVisibility, WORLD_GENRE_LABELS } from '../../core/models/world.model';

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
        <div class="header-actions">
          @if (isEdit()) {
            <a class="back-link" [routerLink]="['/mis-mundos', currentSlug, 'mapa']">Edicion de mapas</a>
            <a class="back-link" [routerLink]="['/mis-mundos', currentSlug, 'world-building']">Gestionar world-building</a>
          }
          <a class="back-link" routerLink="/mis-mundos">Volver</a>
        </div>
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
            ><span>Genero</span>
            <select [(ngModel)]="genre" name="genre" [disabled]="saving()">
              <option [ngValue]="null">Sin genero</option>
              @for (option of genreOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
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

          <fieldset class="linked-block">
            <legend>Novelas vinculadas</legend>
            @if (!novels().length) {
              <p class="hint">Aun no tienes novelas creadas. Puedes gestionarlas en Mis novelas.</p>
            } @else {
              <div class="linked-selector">
                <select
                  [(ngModel)]="pendingNovelSlug"
                  name="pendingNovelSlug"
                  [disabled]="saving()"
                  (ngModelChange)="selectNovel($event)"
                >
                  <option value="">Selecciona una novela</option>
                  @for (novel of availableNovels(); track novel.slug) {
                    <option [value]="novel.slug">{{ novel.title }}</option>
                  }
                </select>
              </div>

              @if (selectedNovels().length) {
                <div class="selected-items">
                  @for (novel of selectedNovels(); track novel.slug) {
                    <button
                      type="button"
                      class="linked-pill"
                      [disabled]="saving()"
                      (click)="removeNovel(novel.slug)"
                    >
                      <span>{{ novel.title }}</span>
                      <strong>×</strong>
                    </button>
                  }
                </div>
              } @else {
                <p class="hint">Todavia no has vinculado novelas a este mundo.</p>
              }
            }
          </fieldset>

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
      .form-pane,
      .linked-block,
      .linked-selector {
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
      .header-actions {
        display: flex;
        gap: 0.5rem;
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
      .hint {
        margin: 0;
        color: var(--text-2);
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
      .selected-items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .linked-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        min-height: 3rem;
        padding: 0.65rem 1rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .linked-pill strong {
        width: 1.5rem;
        height: 1.5rem;
        display: inline-grid;
        place-items: center;
        border-radius: 999px;
        background: color-mix(in srgb, var(--bg-card) 24%, transparent);
        font-size: 1rem;
        line-height: 1;
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
  private readonly novelsService = inject(NovelsService);
  private readonly markdownService = inject(MarkdownService);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly previewHtml = signal('');
  readonly novels = signal<NovelSummary[]>([]);
  readonly selectedNovelSlugs = signal<string[]>([]);
  readonly initialNovelSlugs = signal<string[]>([]);
  readonly availableNovels = computed(() =>
    this.novels().filter((novel) => !this.selectedNovelSlugs().includes(novel.slug)),
  );
  readonly selectedNovels = computed(() => {
    const selected = new Set(this.selectedNovelSlugs());
    return this.novels().filter((novel) => selected.has(novel.slug));
  });

  currentSlug: string | null = null;

  readonly genreOptions = Object.entries(WORLD_GENRE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  name = '';
  tagline = '';
  description = '';
  setting = '';
  magicSystem = '';
  rules = '';
  tagsRaw = '';
  genre: WorldGenre | null = null;
  visibility: WorldVisibility = 'PRIVATE';
  pendingNovelSlug = '';

  constructor() {
    this.novelsService.listMine({ limit: 50, sort: 'recent' }).subscribe({
      next: (response) => this.novels.set(response.data),
      error: () => this.novels.set([]),
    });

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
        this.genre = world.genre;
        this.visibility = world.visibility;
        this.selectedNovelSlugs.set(world.linkedNovels.map((novel) => novel.slug));
        this.initialNovelSlugs.set(world.linkedNovels.map((novel) => novel.slug));
        this.refreshPreview();
      });
    });
  }

  selectNovel(novelSlug: string) {
    if (!novelSlug || this.selectedNovelSlugs().includes(novelSlug)) {
      this.pendingNovelSlug = '';
      return;
    }

    this.selectedNovelSlugs.update((current) => [...current, novelSlug]);
    this.pendingNovelSlug = '';
  }

  removeNovel(novelSlug: string) {
    this.selectedNovelSlugs.update((current) => current.filter((slug) => slug !== novelSlug));
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
      genre: this.genre,
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

    request.pipe(switchMap((world) => this.syncNovelLinks(world.slug, world))).subscribe({
      next: (world) => {
        this.saving.set(false);
        this.initialNovelSlugs.set(this.selectedNovelSlugs());
        this.message.set('Mundo guardado correctamente.');
        void this.router.navigate(['/mis-mundos', world.slug, 'editar']);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('No se pudo guardar el mundo.');
      },
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

  private syncNovelLinks(worldSlug: string, world: { slug: string }) {
    const selectedSlugs = new Set(this.selectedNovelSlugs());
    const currentSlugs = new Set(this.initialNovelSlugs());

    const toLink = [...selectedSlugs].filter((slug) => !currentSlugs.has(slug));
    const toUnlink = [...currentSlugs].filter((slug) => !selectedSlugs.has(slug));

    const operations = [
      ...toLink.map((novelSlug) => this.worldsService.linkNovel(worldSlug, novelSlug)),
      ...toUnlink.map((novelSlug) => this.worldsService.unlinkNovel(worldSlug, novelSlug)),
    ];

    return operations.length ? forkJoin(operations).pipe(switchMap(() => of(world))) : of(world);
  }
}
