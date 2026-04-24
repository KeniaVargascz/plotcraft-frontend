import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { CharacterRole, CharacterStatus } from '../../core/models/character.model';
import { AuthService } from '../../core/services/auth.service';
import { CharactersService } from '../../core/services/characters.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { NovelSummary } from '../../core/models/novel.model';
import { NovelsService } from '../../core/services/novels.service';
import { WorldsService } from '../../core/services/worlds.service';
import { WorldSummary } from '../../core/models/world.model';

@Component({
  selector: 'app-character-form-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="form-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Autor</p>
          <h1>{{ isEdit() ? 'Editar personaje' : 'Nuevo personaje' }}</h1>
          <p class="lede">Trabaja personalidad, historia y tensiones internas con Markdown.</p>
        </div>
        <a class="back-link" routerLink="/mis-personajes">Volver</a>
      </header>

      <form class="editor-grid" (ngSubmit)="submit()">
        <section class="card form-pane">
          <label
            ><span>Nombre</span
            ><input [(ngModel)]="name" name="name" required [disabled]="saving()"
          /></label>
          <div class="split">
            <label
              ><span>Rol</span>
              <select [(ngModel)]="role" name="role" [disabled]="saving()">
                @for (item of roles; track item) {
                  <option [value]="item">{{ item }}</option>
                }
              </select>
            </label>
            <label
              ><span>Estado</span>
              <select [(ngModel)]="status" name="status" [disabled]="saving()">
                @for (item of statuses; track item) {
                  <option [value]="item">{{ item }}</option>
                }
              </select>
            </label>
          </div>
          <label
            ><span>Mundo</span>
            <select [(ngModel)]="worldId" name="worldId" [disabled]="saving()">
              <option [ngValue]="null">Sin mundo asignado</option>
              @for (world of worlds(); track world.id) {
                <option [ngValue]="world.id">{{ world.name }}</option>
              }
            </select>
          </label>
          <div class="split">
            <label
              ><span>Visibilidad</span>
              <select
                [(ngModel)]="isPublic"
                name="isPublic"
                [disabled]="saving()"
                (ngModelChange)="refreshPreview()"
              >
                <option [ngValue]="false">Privado</option>
                <option [ngValue]="true">Publico</option>
              </select>
            </label>
            <label
              ><span>Edad</span
              ><input
                [(ngModel)]="age"
                name="age"
                [disabled]="saving()"
                (ngModelChange)="refreshPreview()"
            /></label>
          </div>
          <label
            ><span>Avatar URL</span
            ><input [(ngModel)]="avatarUrl" name="avatarUrl" [disabled]="saving()"
          /></label>
          <label
            ><span>Alias</span
            ><input [(ngModel)]="aliasesRaw" name="aliasesRaw" [disabled]="saving()"
          /></label>
          <label
            ><span>Tags</span><input [(ngModel)]="tagsRaw" name="tagsRaw" [disabled]="saving()"
          /></label>
          <section class="editor-field">
            <div class="editor-heading">
              <div>
                <span>Perfil del personaje</span>
                <small
                  >Un solo documento con Markdown para ficha, historia, relaciones y arco.</small
                >
              </div>
              <div class="toolbar">
                <button type="button" (click)="applyBlock('h2')" [disabled]="saving()">H2</button>
                <button type="button" (click)="applyBlock('h3')" [disabled]="saving()">H3</button>
                <button
                  type="button"
                  (click)="applyWrap('**', '**', 'texto en negrita')"
                  [disabled]="saving()"
                >
                  B
                </button>
                <button
                  type="button"
                  (click)="applyWrap('*', '*', 'texto en cursiva')"
                  [disabled]="saving()"
                >
                  I
                </button>
                <button
                  type="button"
                  (click)="applyWrap('[', '](https://ejemplo.com)', 'enlace')"
                  [disabled]="saving()"
                >
                  Link
                </button>
                <button type="button" (click)="applyBlock('quote')" [disabled]="saving()">
                  Cita
                </button>
                <button type="button" (click)="applyBlock('list')" [disabled]="saving()">
                  Lista
                </button>
                <button type="button" (click)="applyBlock('table')" [disabled]="saving()">
                  Tabla
                </button>
                <button type="button" (click)="applyBlock('separator')" [disabled]="saving()">
                  ---
                </button>
              </div>
            </div>

            <div class="template-row">
              @for (template of editorTemplates; track template.label) {
                <button
                  type="button"
                  class="template-chip"
                  (click)="insertTemplate(template.content)"
                  [disabled]="saving()"
                >
                  {{ template.label }}
                </button>
              }
            </div>

            <textarea
              #profileEditor
              id="character-profile-editor"
              [(ngModel)]="profileContent"
              name="profileContent"
              rows="18"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
              placeholder="# Nombre del personaje&#10;&#10;## Ficha rapida&#10;| Dato | Valor |&#10;| --- | --- |&#10;| Alias |  |"
            ></textarea>
          </section>
          <fieldset class="novel-links">
            <legend>Novelas vinculadas</legend>
            @if (!novels().length) {
              <p class="hint">Aun no tienes novelas para vincular.</p>
            } @else {
              <div class="novel-selector">
                <select
                  [(ngModel)]="pendingNovelSlug"
                  name="pendingNovelSlug"
                  [disabled]="saving()"
                  (ngModelChange)="selectNovel($event)"
                >
                  <option value="">Selecciona una novela</option>
                  @for (novel of availableNovels(); track novel.id) {
                    <option [value]="novel.slug">{{ novel.title }}</option>
                  }
                </select>
              </div>

              @if (selectedNovels().length) {
                <div class="selected-novels">
                  @for (novel of selectedNovels(); track novel.slug) {
                    <button
                      type="button"
                      class="novel-pill"
                      [disabled]="saving()"
                      (click)="removeNovel(novel.slug)"
                    >
                      <span>{{ novel.title }}</span>
                      <strong>×</strong>
                    </button>
                  }
                </div>
              } @else {
                <p class="hint">Todavia no has vinculado novelas a este personaje.</p>
              }
            }
          </fieldset>
          <div class="actions">
            <button
              type="button"
              class="secondary"
              routerLink="/mis-personajes"
              [disabled]="saving()"
            >
              Cancelar
            </button>
            <button type="submit" [disabled]="saving() || !name.trim()">
              {{ saving() ? 'Guardando...' : isEdit() ? 'Guardar cambios' : 'Crear personaje' }}
            </button>
          </div>
          @if (saveError()) {
            <p class="error">{{ saveError() }}</p>
          }
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
      .split {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .novel-links,
      .novel-selector,
      .selected-novels {
        display: grid;
        gap: 0.75rem;
      }
      .editor-field,
      .editor-heading {
        display: grid;
        gap: 0.75rem;
      }
      .editor-heading {
        align-items: start;
      }
      .editor-heading small {
        color: var(--text-2);
      }
      .toolbar,
      .template-row {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
      }
      .toolbar button,
      .template-chip {
        min-height: 2.25rem;
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: color-mix(in srgb, var(--bg-surface) 90%, white 10%);
        color: var(--text-1);
        cursor: pointer;
      }
      .template-chip {
        background: color-mix(in srgb, var(--accent-glow) 26%, var(--bg-surface));
      }
      .selected-novels {
        display: flex;
        flex-wrap: wrap;
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
      .novel-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        min-height: 3rem;
        padding: 0.65rem 1rem;
        border-radius: 999px;
        background: var(--accent-glow) !important;
        color: var(--accent-text) !important;
      }
      .novel-pill strong {
        width: 1.5rem;
        height: 1.5rem;
        display: inline-grid;
        place-items: center;
        border-radius: 999px;
        background: color-mix(in srgb, var(--bg-card) 24%, transparent);
        font-size: 1rem;
        line-height: 1;
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
      .error {
        margin: 0;
        color: #e58f8f;
      }
      @media (max-width: 960px) {
        .editor-grid,
        .split {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly charactersService = inject(CharactersService);
  private readonly novelsService = inject(NovelsService);
  private readonly worldsService = inject(WorldsService);
  private readonly markdownService = inject(MarkdownService);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly previewHtml = signal('');
  readonly worlds = signal<WorldSummary[]>([]);
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
  readonly roles: CharacterRole[] = [
    'PROTAGONIST',
    'ANTAGONIST',
    'SECONDARY',
    'MENTOR',
    'ALLY',
    'RIVAL',
    'NEUTRAL',
    'BACKGROUND',
  ];
  readonly statuses: CharacterStatus[] = ['ALIVE', 'DECEASED', 'UNKNOWN', 'UNDEAD', 'TRANSFORMED'];
  readonly editorTemplates = [
    {
      label: 'Perfil wiki',
      content:
        '# Nombre del personaje\n\n## Ficha rapida\n| Dato | Valor |\n| --- | --- |\n| Alias |  |\n| Edad |  |\n| Afiliacion |  |\n\n## Resumen\n\nDescribe quien es y por que importa.\n\n## Historia\n\n### Origen\n\n### Desarrollo\n\n### Estado actual\n\n## Relaciones\n\n- **Aliado:** Nombre\n- **Rival:** Nombre\n\n## Curiosidades\n\n- Dato 1\n- Dato 2',
    },
    {
      label: 'Ficha extensa',
      content:
        '## Identidad\n| Campo | Valor |\n| --- | --- |\n| Nombre original |  |\n| Alias |  |\n| Titulo |  |\n| Estado |  |\n\n## Descripcion general\n\n\n## Biografia\n\n### Antes de la historia\n\n### Punto de quiebre\n\n### Situacion actual\n\n## Poderes y capacidades\n\n- Habilidad 1\n- Habilidad 2',
    },
    {
      label: 'Relaciones',
      content:
        '## Relaciones clave\n\n- **Familia:** Nombre\n- **Mentor/a:** Nombre\n- **Interes romantico:** Nombre\n- **Antagonista:** Nombre',
    },
  ];

  private currentSlug: string | null = null;

  name = '';
  role: CharacterRole = 'SECONDARY';
  status: CharacterStatus = 'ALIVE';
  worldId: string | null = null;
  isPublic = false;
  age = '';
  avatarUrl = '';
  aliasesRaw = '';
  tagsRaw = '';
  pendingNovelSlug = '';
  profileContent = '';

  constructor() {
    this.worldsService.listMine({ limit: 50 }).subscribe({
      next: (response) => this.worlds.set(response.data),
    });
    this.novelsService.listMine({ limit: 50, sort: 'recent' }).subscribe({
      next: (response) => this.novels.set(response.data),
      error: () => this.novels.set([]),
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      this.isEdit.set(Boolean(slug));
      this.currentSlug = slug;
      if (!slug) {
        this.refreshPreview();
        return;
      }

      const username = this.authService.getCurrentUserSnapshot()?.username;
      if (!username) return;

      this.charactersService.getBySlug(username, slug).subscribe((character) => {
        this.name = character.name;
        this.role = character.role;
        this.status = character.status;
        this.worldId = character.world?.id ?? null;
        this.isPublic = character.isPublic;
        this.age = character.age ?? '';
        this.avatarUrl = character.avatarUrl ?? '';
        this.aliasesRaw = character.alias.join(', ');
        this.tagsRaw = character.tags.join(', ');
        this.profileContent = this.composeProfileContent(character);
        this.selectedNovelSlugs.set(character.linkedNovels.map((novel) => novel.slug));
        this.initialNovelSlugs.set(character.linkedNovels.map((novel) => novel.slug));
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
    const username = this.authService.getCurrentUserSnapshot()?.username;
    if (!username || !this.name.trim() || this.saving()) return;

    this.saveError.set('');
    this.saving.set(true);
    const payload = {
      name: this.name.trim(),
      role: this.role,
      status: this.status,
      worldId: this.worldId,
      isPublic: this.isPublic,
      age: this.age.trim() || null,
      avatarUrl: this.avatarUrl.trim() || null,
      alias: this.aliasesRaw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      tags: this.tagsRaw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      appearance: null,
      personality: null,
      motivations: null,
      fears: null,
      strengths: null,
      weaknesses: null,
      backstory: this.profileContent.trim() || null,
      arc: null,
    };

    const request =
      this.isEdit() && this.currentSlug
        ? this.charactersService.update(username, this.currentSlug, payload)
        : this.charactersService.create(payload);

    request
      .pipe(
        switchMap((character) =>
          this.syncNovelLinks(username, character.slug).pipe(map(() => character)),
        ),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (character) => {
          this.initialNovelSlugs.set(this.selectedNovelSlugs());
          void this.router.navigate(['/mis-personajes', character.slug, 'editar']);
        },
        error: () => {
          this.saveError.set('No se pudo guardar el personaje. Intenta de nuevo.');
        },
      });
  }

  refreshPreview() {
    const content = [
      `## Ficha\n- Visibilidad: ${this.isPublic ? 'Publico' : 'Privado'}`,
      this.age && `- Edad: ${this.age}`,
      this.profileContent.trim(),
    ]
      .filter(Boolean)
      .join('\n\n');
    this.previewHtml.set(this.markdownService.render(content || 'Sin contenido todavia.'));
  }

  applyWrap(prefix: string, suffix: string, placeholder: string) {
    this.insertAtSelection((selected) => `${prefix}${selected || placeholder}${suffix}`);
  }

  applyBlock(type: 'h2' | 'h3' | 'quote' | 'list' | 'table' | 'separator') {
    const blocks: Record<typeof type, string> = {
      h2: '## Nueva seccion',
      h3: '### Subtitulo',
      quote: '> Cita o frase memorable',
      list: '- Punto 1\n- Punto 2\n- Punto 3',
      table: '| Campo | Valor |\n| --- | --- |\n| Dato |  |',
      separator: '---',
    };
    this.insertAtSelection((selected) =>
      selected ? `${selected}\n\n${blocks[type]}` : blocks[type],
    );
  }

  insertTemplate(content: string) {
    this.insertAtSelection((selected) => {
      const next = selected ? `${selected}\n\n${content}` : content;
      return next;
    });
  }

  private insertAtSelection(transform: (selected: string) => string) {
    const textarea = document.getElementById(
      'character-profile-editor',
    ) as HTMLTextAreaElement | null;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart ?? this.profileContent.length;
    const end = textarea.selectionEnd ?? this.profileContent.length;
    const selected = this.profileContent.slice(start, end);
    const replacement = transform(selected);
    this.profileContent =
      this.profileContent.slice(0, start) + replacement + this.profileContent.slice(end);
    this.refreshPreview();

    queueMicrotask(() => {
      textarea.focus();
      const caret = start + replacement.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  private composeProfileContent(character: {
    appearance: string | null;
    personality: string | null;
    motivations: string | null;
    fears: string | null;
    strengths: string | null;
    weaknesses: string | null;
    backstory: string | null;
    arc: string | null;
  }) {
    const existingSections = [
      character.appearance && `## Apariencia\n${character.appearance}`,
      character.personality && `## Personalidad\n${character.personality}`,
      character.motivations && `## Motivaciones\n${character.motivations}`,
      character.fears && `## Miedos\n${character.fears}`,
      character.strengths && `## Fortalezas\n${character.strengths}`,
      character.weaknesses && `## Debilidades\n${character.weaknesses}`,
      character.backstory && `## Backstory\n${character.backstory}`,
      character.arc && `## Arco\n${character.arc}`,
    ].filter(Boolean);

    return existingSections.length ? existingSections.join('\n\n') : '';
  }

  private syncNovelLinks(username: string, characterSlug: string) {
    const selected = new Set(this.selectedNovelSlugs());
    const initial = new Set(this.initialNovelSlugs());

    const toLink = [...selected].filter((slug) => !initial.has(slug));
    const toUnlink = [...initial].filter((slug) => !selected.has(slug));

    const operations = [
      ...toLink.map((novelSlug) =>
        this.charactersService.linkNovel(username, characterSlug, novelSlug),
      ),
      ...toUnlink.map((novelSlug) =>
        this.charactersService.unlinkNovel(username, characterSlug, novelSlug),
      ),
    ];

    return operations.length ? forkJoin(operations) : of([]);
  }
}
