import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
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
          <label
            ><span>Apariencia</span
            ><textarea
              [(ngModel)]="appearance"
              name="appearance"
              rows="4"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
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
          <label
            ><span>Personalidad</span
            ><textarea
              [(ngModel)]="personality"
              name="personality"
              rows="5"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
          <label
            ><span>Motivaciones</span
            ><textarea
              [(ngModel)]="motivations"
              name="motivations"
              rows="5"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
          <label
            ><span>Miedos</span
            ><textarea
              [(ngModel)]="fears"
              name="fears"
              rows="5"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
          <label
            ><span>Fortalezas</span
            ><textarea
              [(ngModel)]="strengths"
              name="strengths"
              rows="5"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
          <label
            ><span>Debilidades</span
            ><textarea
              [(ngModel)]="weaknesses"
              name="weaknesses"
              rows="5"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
          <label
            ><span>Backstory</span
            ><textarea
              [(ngModel)]="backstory"
              name="backstory"
              rows="7"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>
          <label
            ><span>Arco</span
            ><textarea
              [(ngModel)]="arc"
              name="arc"
              rows="6"
              [disabled]="saving()"
              (ngModelChange)="refreshPreview()"
            ></textarea>
          </label>

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
  appearance = '';
  personality = '';
  motivations = '';
  fears = '';
  strengths = '';
  weaknesses = '';
  backstory = '';
  arc = '';

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
        this.appearance = character.appearance ?? '';
        this.personality = character.personality ?? '';
        this.motivations = character.motivations ?? '';
        this.fears = character.fears ?? '';
        this.strengths = character.strengths ?? '';
        this.weaknesses = character.weaknesses ?? '';
        this.backstory = character.backstory ?? '';
        this.arc = character.arc ?? '';
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
      appearance: this.appearance.trim() || null,
      personality: this.personality.trim() || null,
      motivations: this.motivations.trim() || null,
      fears: this.fears.trim() || null,
      strengths: this.strengths.trim() || null,
      weaknesses: this.weaknesses.trim() || null,
      backstory: this.backstory.trim() || null,
      arc: this.arc.trim() || null,
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
    this.previewHtml.set(
      this.markdownService.render(
        [
          `## Ficha\n- Visibilidad: ${this.isPublic ? 'Publico' : 'Privado'}`,
          this.age && `- Edad: ${this.age}`,
          this.appearance && `## Apariencia\n${this.appearance}`,
          this.personality && `## Personalidad\n${this.personality}`,
          this.motivations && `## Motivaciones\n${this.motivations}`,
          this.fears && `## Miedos\n${this.fears}`,
          this.strengths && `## Fortalezas\n${this.strengths}`,
          this.weaknesses && `## Debilidades\n${this.weaknesses}`,
          this.backstory && `## Backstory\n${this.backstory}`,
          this.arc && `## Arco\n${this.arc}`,
        ]
          .filter(Boolean)
          .join('\n\n') || 'Sin contenido todavia.',
      ),
    );
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
