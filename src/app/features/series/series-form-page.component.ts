import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NovelSummary } from '../../core/models/novel.model';
import { NovelsService } from '../../core/services/novels.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import {
  SERIES_STATUS_LABELS,
  SERIES_TYPE_DESCRIPTIONS,
  SERIES_TYPE_LABELS,
  SeriesDetail,
  SeriesNovelItem,
  SeriesStatus,
  SeriesType,
} from './models/series.model';
import { SeriesService } from './services/series.service';

@Component({
  selector: 'app-series-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    DragDropModule,
    LoadingSpinnerComponent,
  ],
  template: `
    <section class="page">
      <header>
        <h1>{{ isEdit() ? 'Editar saga' : 'Nueva saga' }}</h1>
        <a routerLink="/mis-sagas">Volver</a>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()" class="form">
          <label>
            Título
            <input type="text" formControlName="title" maxlength="300" />
          </label>

          <label>
            Tipo
            <select formControlName="type">
              @for (t of typeKeys; track t) {
                <option [value]="t">{{ typeLabels[t] }} — {{ typeDescriptions[t] }}</option>
              }
            </select>
          </label>

          <label>
            Descripción
            <textarea formControlName="description" rows="5" maxlength="5000"></textarea>
          </label>

          <label>
            URL de portada
            <input type="url" formControlName="coverUrl" placeholder="https://..." />
          </label>

          @if (errorMessage()) {
            <p class="error">{{ errorMessage() }}</p>
          }

          <div class="actions">
            <button type="submit" [disabled]="saving() || form.invalid">
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>

        @if (isEdit() && series(); as s) {
          <section class="novels-block">
            <h2>Novelas de la serie</h2>
            @if (!s.novels.length) {
              <p class="empty">Esta serie aún no tiene novelas.</p>
            } @else {
              <ol
                cdkDropList
                class="novels-list"
                (cdkDropListDropped)="onDrop($event)"
              >
                @for (n of orderedNovels(); track n.id) {
                  <li cdkDrag class="novel-row">
                    <span class="drag-handle" cdkDragHandle>⋮⋮</span>
                    <span class="order">{{ $index + 1 }}</span>
                    <span class="title">{{ n.title }}</span>
                    <button type="button" (click)="removeNovel(n)">Quitar</button>
                  </li>
                }
              </ol>
            }

            <div class="add-novel">
              <label>
                Añadir novela
                <select [(ngModel)]="novelToAdd" [ngModelOptions]="{ standalone: true }">
                  <option value="">Selecciona una novela</option>
                  @for (n of availableNovels(); track n.id) {
                    <option [value]="n.id">{{ n.title }}</option>
                  }
                </select>
              </label>
              <button type="button" (click)="addNovel()" [disabled]="!novelToAdd">
                Añadir
              </button>
            </div>
          </section>

          <section class="status-block">
            <h2>Estado de la serie</h2>
            <div class="status-row">
              <select [(ngModel)]="statusValue" [ngModelOptions]="{ standalone: true }">
                @for (k of statusKeys; track k) {
                  <option [value]="k">{{ statusLabels[k] }}</option>
                }
              </select>
              <button type="button" (click)="updateStatus()" [disabled]="statusSaving()">
                {{ statusSaving() ? 'Actualizando...' : 'Actualizar estado' }}
              </button>
            </div>
            @if (statusError()) {
              <p class="error">{{ statusError() }}</p>
            }
          </section>
        }
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.5rem;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .form {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
        border-radius: 1.25rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
      }
      label {
        display: grid;
        gap: 0.4rem;
        color: var(--text-2);
      }
      input,
      textarea,
      select,
      button {
        padding: 0.7rem 0.9rem;
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      button {
        cursor: pointer;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
      }
      .novels-block,
      .status-block {
        padding: 1.25rem;
        border-radius: 1.25rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        display: grid;
        gap: 1rem;
      }
      .novels-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.5rem;
      }
      .novel-row {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        gap: 0.75rem;
        align-items: center;
        padding: 0.75rem;
        border-radius: 0.85rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .drag-handle {
        cursor: grab;
        color: var(--text-3);
      }
      .order {
        font-weight: 700;
        color: var(--accent-text);
      }
      .add-novel {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75rem;
        align-items: end;
      }
      .status-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75rem;
      }
      .error {
        color: #ff8b8b;
        margin: 0;
      }
      .empty {
        color: var(--text-2);
      }
    `,
  ],
})
export class SeriesFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly seriesService = inject(SeriesService);
  private readonly novelsService = inject(NovelsService);

  readonly typeLabels = SERIES_TYPE_LABELS;
  readonly typeDescriptions = SERIES_TYPE_DESCRIPTIONS;
  readonly statusLabels = SERIES_STATUS_LABELS;
  readonly typeKeys = Object.keys(SERIES_TYPE_LABELS) as SeriesType[];
  readonly statusKeys = Object.keys(SERIES_STATUS_LABELS) as SeriesStatus[];

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly statusSaving = signal(false);
  readonly errorMessage = signal('');
  readonly statusError = signal('');
  readonly isEdit = signal(false);
  readonly series = signal<SeriesDetail | null>(null);
  readonly userNovels = signal<NovelSummary[]>([]);
  readonly orderedNovels = signal<SeriesNovelItem[]>([]);

  readonly availableNovels = computed(() => {
    const current = new Set((this.series()?.novels ?? []).map((n) => n.id));
    return this.userNovels().filter((n) => !current.has(n.id));
  });

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(300)]],
    type: ['SAGA' as SeriesType, Validators.required],
    description: ['', Validators.maxLength(5000)],
    coverUrl: [''],
  });

  slug: string | null = null;
  novelToAdd = '';
  statusValue: SeriesStatus = 'IN_PROGRESS';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.slug = params.get('slug');
      this.isEdit.set(!!this.slug);

      this.novelsService.listMine({ limit: 100 }).subscribe({
        next: (r) => this.userNovels.set(r.data),
      });

      if (this.slug) {
        this.loadSeries(this.slug);
      }
    });
  }

  private loadSeries(slug: string): void {
    this.loading.set(true);
    this.seriesService.getBySlug(slug).subscribe({
      next: (s) => {
        this.applySeries(s);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar la serie.');
        this.loading.set(false);
      },
    });
  }

  private applySeries(s: SeriesDetail): void {
    this.series.set(s);
    this.form.patchValue({
      title: s.title,
      type: s.type,
      description: s.description ?? '',
      coverUrl: s.coverUrl ?? '',
    });
    this.form.controls.type.disable();
    this.orderedNovels.set([...s.novels].sort((a, b) => a.orderIndex - b.orderIndex));
    this.statusValue = s.status;
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isEdit() && this.slug) {
      this.seriesService
        .update(this.slug, {
          title: value.title,
          description: value.description || undefined,
          coverUrl: value.coverUrl || undefined,
        })
        .subscribe({
          next: (s) => {
            this.applySeries(s);
            this.saving.set(false);
          },
          error: () => {
            this.errorMessage.set('No se pudo guardar la serie.');
            this.saving.set(false);
          },
        });
    } else {
      this.seriesService
        .create({
          title: value.title,
          type: value.type,
          description: value.description || undefined,
          coverUrl: value.coverUrl || undefined,
        })
        .subscribe({
          next: (s) => {
            this.saving.set(false);
            this.router.navigate(['/mis-sagas', s.slug, 'editar']);
          },
          error: () => {
            this.errorMessage.set('No se pudo crear la serie.');
            this.saving.set(false);
          },
        });
    }
  }

  onDrop(event: CdkDragDrop<SeriesNovelItem[]>): void {
    if (!this.slug) return;
    const list = [...this.orderedNovels()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.orderedNovels.set(list);
    const payload = list.map((n, idx) => ({ novelId: n.id, orderIndex: idx + 1 }));
    this.seriesService.reorderNovels(this.slug, payload).subscribe({
      next: (s) => this.applySeries(s),
    });
  }

  addNovel(): void {
    if (!this.slug || !this.novelToAdd) return;
    const nextIndex = (this.series()?.novels.length ?? 0) + 1;
    this.seriesService.addNovel(this.slug, this.novelToAdd, nextIndex).subscribe({
      next: (s) => {
        this.applySeries(s);
        this.novelToAdd = '';
      },
    });
  }

  removeNovel(novel: SeriesNovelItem): void {
    if (!this.slug) return;
    this.seriesService.removeNovel(this.slug, novel.id).subscribe({
      next: (s) => this.applySeries(s),
    });
  }

  updateStatus(): void {
    if (!this.slug) return;
    this.statusSaving.set(true);
    this.statusError.set('');
    this.seriesService.updateStatus(this.slug, this.statusValue).subscribe({
      next: (s) => {
        this.applySeries(s);
        this.statusSaving.set(false);
      },
      error: () => {
        this.statusError.set('No se pudo actualizar el estado.');
        this.statusSaving.set(false);
      },
    });
  }
}
