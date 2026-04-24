import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { DatePipe } from '@angular/common';
import { TimelineSummary, TimelineDetail, TimelineEvent } from '../../core/models/timeline.model';
import { TimelineService } from '../../core/services/timeline.service';
import { NovelsService } from '../../core/services/novels.service';
import { NovelSummary } from '../../core/models/novel.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

/* ─── Inline Create Dialog ─── */
@Component({
  selector: 'app-create-timeline-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Nuevo timeline</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <label class="field">
          <span class="label">Nombre <span class="req">*</span></span>
          <input type="text" [(ngModel)]="name" placeholder="Nombre del timeline" />
        </label>
        <label class="field">
          <span class="label">Descripcion</span>
          <textarea
            [(ngModel)]="description"
            rows="3"
            placeholder="Descripcion opcional..."
          ></textarea>
        </label>
        <label class="field">
          <span class="label">Novela (opcional)</span>
          <select [(ngModel)]="novelId">
            <option [ngValue]="null">-- Ninguna --</option>
            @for (n of novels(); track n.id) {
              <option [value]="n.id">{{ n.title }}</option>
            }
          </select>
        </label>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" class="btn-cancel" mat-dialog-close>Cancelar</button>
      <button type="button" class="btn-save" [disabled]="!name.trim()" (click)="confirm()">
        Crear
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form-grid {
        display: grid;
        gap: 0.75rem;
        min-width: 340px;
      }
      .field {
        display: grid;
        gap: 0.25rem;
      }
      .label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-2);
      }
      .req {
        color: var(--danger);
      }
      input,
      textarea,
      select {
        padding: 0.5rem 0.65rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.82rem;
        font-family: inherit;
      }
      textarea {
        resize: vertical;
      }
      .btn-cancel,
      .btn-save {
        padding: 0.55rem 1.1rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        font-size: 0.82rem;
        cursor: pointer;
      }
      .btn-cancel {
        background: var(--bg-surface);
        color: var(--text-2);
      }
      .btn-save {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .btn-save:disabled {
        opacity: 0.5;
        cursor: default;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTimelineDialogComponent {
  private readonly novelsService = inject(NovelsService);
  private readonly dialogRef = inject(MatDialogRef<CreateTimelineDialogComponent>);

  name = '';
  description = '';
  novelId: string | null = null;
  readonly novels = signal<NovelSummary[]>([]);

  constructor() {
    this.novelsService.listMine({ limit: 50 }).subscribe({
      next: (res) => this.novels.set(res.data),
    });
  }

  confirm() {
    if (!this.name.trim()) return;
    this.dialogRef.close({
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      novelId: this.novelId || undefined,
    });
  }
}

/* ─── Timelines List Page ─── */
@Component({
  selector: 'app-timelines-list-page',
  standalone: true,
  imports: [RouterLink, DatePipe, MatDialogModule],
  template: `
    <section class="page-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Autor</p>
          <h1>Mis timelines</h1>
          <p class="lede">Organiza la cronologia de tus historias.</p>
        </div>
        <button type="button" class="cta" (click)="openCreateDialog()">+ Nuevo timeline</button>
      </header>

      @if (loading()) {
        <p class="state">Cargando timelines...</p>
      } @else if (!timelines().length) {
        <section class="card empty">
          <h2>Aun no tienes timelines</h2>
          <p>Crea tu primer timeline para empezar a organizar los eventos de tu historia.</p>
        </section>
      } @else {
        <div class="two-col">
          <!-- Sidebar list -->
          <aside class="sidebar">
            @for (tl of timelines(); track tl.id) {
              <article
                class="tl-item"
                [class.active]="selectedId() === tl.id"
                (click)="selectTimeline(tl)"
              >
                <h4 class="tl-name">{{ tl.name }}</h4>
                <div class="tl-meta">
                  <span>{{ tl.eventsCount }} eventos</span>
                  @if (tl.novel) {
                    <span class="novel-link">{{ tl.novel.title }}</span>
                  }
                </div>
                <span class="tl-date">{{ tl.updatedAt | date: 'dd/MM/yyyy' }}</span>
                <div class="tl-actions">
                  <a [routerLink]="['/mis-timelines', tl.id]" class="act-link">Abrir en canvas</a>
                  <button
                    type="button"
                    class="act-del"
                    [disabled]="removing() === tl.id"
                    (click)="confirmDelete(tl, $event)"
                  >
                    {{ removing() === tl.id ? 'Eliminando...' : 'Eliminar' }}
                  </button>
                </div>
              </article>
            }
          </aside>

          <!-- Preview panel -->
          <div class="preview">
            @if (!selectedDetail()) {
              <div class="empty-preview card">
                <p>Selecciona un timeline para ver su vista previa</p>
              </div>
            } @else {
              <div class="preview-content card">
                <h2>{{ selectedDetail()!.name }}</h2>
                @if (selectedDetail()!.description) {
                  <p class="desc">{{ selectedDetail()!.description }}</p>
                }

                <div class="stats-grid">
                  <div class="stat-card">
                    <span class="stat-num">{{ selectedDetail()!.events.length }}</span>
                    <span class="stat-label">Total eventos</span>
                  </div>
                  @for (ts of typeStats(); track ts.type) {
                    <div class="stat-card">
                      <span class="stat-num">{{ ts.count }}</span>
                      <span class="stat-label">{{ ts.label }}</span>
                    </div>
                  }
                  @for (rs of relevanceStats(); track rs.relevance) {
                    <div class="stat-card">
                      <span class="stat-num">{{ rs.count }}</span>
                      <span class="stat-label">{{ rs.label }}</span>
                    </div>
                  }
                </div>

                @if (lastEvents().length) {
                  <h3 class="sub-title">Ultimos eventos</h3>
                  <ul class="compact-list">
                    @for (ev of lastEvents(); track ev.id) {
                      <li>
                        <strong>{{ ev.title }}</strong>
                        @if (ev.dateLabel) {
                          <span class="ev-date">{{ ev.dateLabel }}</span>
                        }
                      </li>
                    }
                  </ul>
                }

                <a [routerLink]="['/mis-timelines', selectedDetail()!.id]" class="cta open-btn"
                  >Abrir en canvas</a
                >
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page-shell {
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
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .eyebrow,
      .lede,
      .state,
      .empty p {
        color: var(--text-2);
      }
      .cta {
        padding: 0.8rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        text-decoration: none;
        background: var(--accent-glow);
        color: var(--accent-text);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
      }

      /* Two-column layout */
      .two-col {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 1rem;
        min-height: 400px;
      }

      /* Sidebar */
      .sidebar {
        display: grid;
        gap: 0.5rem;
        align-content: start;
        max-height: calc(100vh - 14rem);
        overflow-y: auto;
      }
      .tl-item {
        padding: 0.65rem 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        cursor: pointer;
        display: grid;
        gap: 0.25rem;
        transition: border-color 0.15s;
      }
      .tl-item:hover {
        border-color: var(--accent);
      }
      .tl-item.active {
        border-color: var(--accent);
        background: var(--accent-glow);
      }
      .tl-name {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-1);
      }
      .tl-meta {
        display: flex;
        gap: 0.5rem;
        font-size: 0.7rem;
        color: var(--text-3);
      }
      .novel-link {
        color: var(--accent);
        font-weight: 500;
      }
      .tl-date {
        font-size: 0.65rem;
        color: var(--text-3);
      }
      .tl-actions {
        display: flex;
        gap: 0.4rem;
        padding-top: 0.25rem;
      }
      .act-link,
      .act-del {
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        cursor: pointer;
        text-decoration: none;
      }
      .act-link:hover {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .act-del:hover {
        background: var(--danger);
        color: #fff;
      }

      /* Preview */
      .preview {
        display: grid;
        align-content: start;
        gap: 1rem;
      }
      .empty-preview {
        display: grid;
        place-items: center;
        min-height: 300px;
      }
      .empty-preview p {
        color: var(--text-3);
      }
      .preview-content {
        display: grid;
        gap: 0.75rem;
      }
      .preview-content h2 {
        margin: 0;
        font-size: 1.2rem;
        color: var(--text-1);
      }
      .desc {
        color: var(--text-2);
        font-size: 0.85rem;
        margin: 0;
      }
      .stats-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .stat-card {
        padding: 0.5rem 0.75rem;
        border-radius: 0.75rem;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        display: grid;
        text-align: center;
        min-width: 80px;
      }
      .stat-num {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--accent);
      }
      .stat-label {
        font-size: 0.65rem;
        color: var(--text-3);
      }
      .sub-title {
        margin: 0.5rem 0 0;
        font-size: 0.9rem;
        color: var(--text-1);
      }
      .compact-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.35rem;
      }
      .compact-list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        padding: 0.3rem 0.5rem;
        border-radius: 0.5rem;
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .ev-date {
        font-size: 0.7rem;
        color: var(--text-3);
      }
      .open-btn {
        text-align: center;
        margin-top: 0.5rem;
      }

      @media (max-width: 768px) {
        .two-col {
          grid-template-columns: 1fr;
        }
        .sidebar {
          max-height: 250px;
        }
      }
    `,
  ],
})
export class TimelinesListPageComponent {
  private readonly timelineService = inject(TimelineService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly timelines = signal<TimelineSummary[]>([]);
  readonly loading = signal(true);
  readonly removing = signal<string | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly selectedDetail = signal<TimelineDetail | null>(null);

  constructor() {
    this.load();
  }

  selectTimeline(tl: TimelineSummary) {
    this.selectedId.set(tl.id);
    this.selectedDetail.set(null);
    this.timelineService.getById(tl.id).subscribe({
      next: (detail) => this.selectedDetail.set(detail),
    });
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateTimelineDialogComponent, {
      width: '440px',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.timelineService.create(result).subscribe({
        next: () => this.load(),
      });
    });
  }

  confirmDelete(tl: TimelineSummary, ev: Event) {
    ev.stopPropagation();
    if (this.removing()) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar timeline',
        description: `Se eliminara "${tl.name}" y todos sus eventos. Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed !== true) return;
      this.removing.set(tl.id);
      this.timelineService
        .remove(tl.id, true)
        .pipe(finalize(() => this.removing.set(null)))
        .subscribe({
          next: () => {
            if (this.selectedId() === tl.id) {
              this.selectedId.set(null);
              this.selectedDetail.set(null);
            }
            this.load();
          },
        });
    });
  }

  /* ─── Computed stats ─── */

  typeStats(): { type: string; label: string; count: number }[] {
    const detail = this.selectedDetail();
    if (!detail) return [];
    const labels: Record<string, string> = {
      WORLD_EVENT: 'Mundo',
      STORY_EVENT: 'Historia',
      CHARACTER_ARC: 'Personaje',
      CHAPTER_EVENT: 'Capitulo',
      LORE_EVENT: 'Lore',
      NOTE: 'Nota',
    };
    const counts = new Map<string, number>();
    for (const ev of detail.events) {
      counts.set(ev.type, (counts.get(ev.type) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([type, count]) => ({
      type,
      label: labels[type] || type,
      count,
    }));
  }

  relevanceStats(): { relevance: string; label: string; count: number }[] {
    const detail = this.selectedDetail();
    if (!detail) return [];
    const labels: Record<string, string> = {
      CRITICAL: 'Critico',
      MAJOR: 'Mayor',
      MINOR: 'Menor',
      BACKGROUND: 'Fondo',
    };
    const counts = new Map<string, number>();
    for (const ev of detail.events) {
      counts.set(ev.relevance, (counts.get(ev.relevance) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([relevance, count]) => ({
      relevance,
      label: labels[relevance] || relevance,
      count,
    }));
  }

  lastEvents(): TimelineEvent[] {
    const detail = this.selectedDetail();
    if (!detail) return [];
    return detail.events.slice(-5).reverse();
  }

  private load() {
    this.loading.set(true);
    this.timelineService
      .listMine()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => this.timelines.set(list),
        error: () => this.timelines.set([]),
      });
  }
}
