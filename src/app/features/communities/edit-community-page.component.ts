import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NovelsService } from '../../core/services/novels.service';
import { NovelSummary } from '../../core/models/novel.model';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../shared/components/alert-dialog/alert-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { COMMUNITY_TYPE_LABELS, Community } from './models/community.model';
import { CommunityService } from './services/community.service';

@Component({
  selector: 'app-edit-community-page',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (community(); as c) {
      <section class="page">
        <h1>Editar comunidad</h1>

        <div class="readonly">
          <p><strong>Tipo:</strong> {{ typeLabel(c) }}</p>
          @if (c.linkedNovel) {
            <p><strong>Novela vinculada:</strong> {{ c.linkedNovel.title }}</p>
          }
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>
            Nombre
            <input type="text" formControlName="name" maxlength="200" />
          </label>
          <label>
            Descripción
            <textarea formControlName="description" rows="3" maxlength="2000"></textarea>
          </label>
          <label>
            Reglas <small>(Markdown soportado)</small>
            <textarea formControlName="rules" rows="5" maxlength="5000"></textarea>
          </label>
          <label>
            URL de portada
            <input type="url" formControlName="coverUrl" />
          </label>
          <label>
            URL de banner
            <input type="url" formControlName="bannerUrl" />
          </label>

          @if (errorMessage()) {
            <div class="error">{{ errorMessage() }}</div>
          }

          <button type="submit" class="primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>

        @if (c.type === 'PRIVATE') {
          <section class="related">
            <h2>Obras relacionadas</h2>
            <p class="hint">Puedes mencionar otras de tus novelas en la página de la comunidad.</p>
            @if (!c.relatedNovels?.length) {
              <p class="muted">Aún no has agregado obras relacionadas.</p>
            } @else {
              <ul class="list">
                @for (n of c.relatedNovels; track n.id) {
                  <li>
                    <a [routerLink]="['/novelas', n.slug]">{{ n.title }}</a>
                    <button type="button" (click)="removeRelated(n.id)">Eliminar</button>
                  </li>
                }
              </ul>
            }
            <div class="add-row">
              <select [(ngModel)]="selectedNovelId">
                <option value="">— Selecciona una novela tuya —</option>
                @for (n of pickableNovels(); track n.id) {
                  <option [value]="n.id">{{ n.title }}</option>
                }
              </select>
              <button
                type="button"
                class="primary"
                [disabled]="!selectedNovelId || addingRelated()"
                (click)="addRelated()"
              >
                {{ addingRelated() ? 'Agregando…' : 'Agregar' }}
              </button>
            </div>
            @if (relatedError()) {
              <div class="error">{{ relatedError() }}</div>
            }
          </section>
        }
      </section>
    }
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
        max-width: 720px;
      }
      h1 {
        margin: 0;
      }
      .readonly p {
        margin: 0.25rem 0;
        color: var(--text-2);
      }
      form {
        display: grid;
        gap: 1rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
      }
      input,
      textarea {
        padding: 0.65rem 0.85rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        font: inherit;
      }
      .error {
        padding: 0.75rem;
        border-radius: 0.6rem;
        background: rgba(214, 90, 90, 0.15);
        color: #e49d9d;
      }
      .primary {
        padding: 0.75rem 1.25rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        border: none;
        cursor: pointer;
        font-weight: 600;
      }
      .primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .related {
        display: grid;
        gap: 0.6rem;
        padding: 1rem;
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: var(--bg-card);
      }
      .related h2 {
        margin: 0;
        font-size: 1.05rem;
      }
      .related .hint {
        margin: 0;
        color: var(--text-3);
        font-size: 0.85rem;
      }
      .related .muted {
        color: var(--text-3);
        margin: 0;
      }
      .related .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.4rem;
      }
      .related .list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 0.6rem;
        background: var(--bg-surface);
      }
      .related .list a {
        color: var(--text-1);
        text-decoration: none;
      }
      .related .list button {
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 0.4rem;
        color: var(--text-3);
        cursor: pointer;
        padding: 0.25rem 0.6rem;
        font-size: 0.78rem;
      }
      .add-row {
        display: flex;
        gap: 0.5rem;
      }
      .add-row select {
        flex: 1;
        padding: 0.55rem 0.75rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
    `,
  ],
})
export class EditCommunityPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CommunityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly novelsService = inject(NovelsService);

  readonly community = signal<Community | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly myNovels = signal<NovelSummary[]>([]);
  readonly addingRelated = signal(false);
  readonly relatedError = signal<string | null>(null);
  selectedNovelId = '';

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    rules: ['', [Validators.maxLength(5000)]],
    coverUrl: [''],
    bannerUrl: [''],
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;
    this.service.getCommunityBySlug(slug).subscribe({
      next: (c) => {
        this.community.set(c);
        this.form.patchValue({
          name: c.name,
          description: c.description ?? '',
          rules: c.rules ?? '',
          coverUrl: c.coverUrl ?? '',
          bannerUrl: c.bannerUrl ?? '',
        });
        this.loading.set(false);
        if (c.type === 'PRIVATE') {
          this.novelsService.listMine({ limit: 100 }).subscribe({
            next: (res) => this.myNovels.set(res.data),
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  pickableNovels(): NovelSummary[] {
    const c = this.community();
    if (!c) return [];
    const taken = new Set(c.relatedNovels?.map((n) => n.id) ?? []);
    return this.myNovels().filter((n) => !taken.has(n.id) && n.slug !== c.linkedNovel?.slug);
  }

  addRelated(): void {
    const c = this.community();
    if (!c || !this.selectedNovelId) return;
    this.addingRelated.set(true);
    this.relatedError.set(null);
    this.service.addRelatedNovel(c.slug, this.selectedNovelId).subscribe({
      next: (updated) => {
        this.community.set(updated);
        this.selectedNovelId = '';
        this.addingRelated.set(false);
      },
      error: (err) => {
        this.addingRelated.set(false);
        this.relatedError.set(
          err?.error?.error?.message || err?.error?.message || 'No se pudo agregar la obra.',
        );
      },
    });
  }

  removeRelated(novelId: string): void {
    const c = this.community();
    if (!c) return;
    this.service.removeRelatedNovel(c.slug, novelId).subscribe({
      next: (updated) => this.community.set(updated),
    });
  }

  typeLabel(c: Community): string {
    return COMMUNITY_TYPE_LABELS[c.type];
  }

  submit(): void {
    const c = this.community();
    if (!c || this.form.invalid) return;
    this.saving.set(true);
    this.errorMessage.set(null);
    const v = this.form.value;
    this.service
      .update(c.slug, {
        name: v.name!,
        description: v.description || undefined,
        rules: v.rules || undefined,
        coverUrl: v.coverUrl || undefined,
        bannerUrl: v.bannerUrl || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.dialog.open(AlertDialogComponent, {
            data: { title: 'Guardado', message: 'Comunidad actualizada correctamente.' },
          });
          void this.router.navigate(['/comunidades', updated.slug]);
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err?.error?.error?.message || err?.error?.message || err?.message || 'Error al guardar';
          this.errorMessage.set(msg);
        },
      });
  }
}
