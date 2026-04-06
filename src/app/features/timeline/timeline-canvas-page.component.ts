import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { finalize } from 'rxjs';
import { TimelineDetail, TimelineEvent } from '../../core/models/timeline.model';
import { TimelineService } from '../../core/services/timeline.service';
import { TimelineEventCardComponent } from './components/timeline-event-card.component';
import { TimelineFiltersComponent, TimelineFilters } from './components/timeline-filters.component';
import {
  TimelineEventFormDialogComponent,
  TimelineEventFormData,
} from './components/timeline-event-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-timeline-canvas-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatDialogModule,
    DragDropModule,
    TimelineEventCardComponent,
    TimelineFiltersComponent,
  ],
  template: `
    @if (loading()) {
      <div class="loading-shell"><p>Cargando timeline...</p></div>
    } @else if (timeline()) {
      <section class="canvas-shell">
        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <a routerLink="/mis-timelines" class="back-btn">← Volver</a>
            <input
              type="text"
              class="title-input"
              [ngModel]="timeline()!.name"
              (ngModelChange)="onTitleChange($event)"
              placeholder="Nombre del timeline"
            />
            @if (timeline()!.novel) {
              <span class="novel-badge">{{ timeline()!.novel!.title }}</span>
            }
          </div>

          <div class="topbar-right">
            <button type="button" class="tb-btn primary" (click)="openEventDialog()">
              + Evento
            </button>
            <button type="button" class="tb-btn" (click)="exportJson()">Exportar JSON</button>
            <div class="view-toggle">
              <button
                type="button"
                class="toggle-opt"
                [class.active]="viewMode() === 'canvas'"
                (click)="viewMode.set('canvas')"
              >
                Linea
              </button>
              <button
                type="button"
                class="toggle-opt"
                [class.active]="viewMode() === 'list'"
                (click)="viewMode.set('list')"
              >
                Lista
              </button>
            </div>
          </div>
        </header>

        <!-- Filters -->
        <app-timeline-filters (filterChange)="onFilterChange($event)" />

        <!-- Canvas mode -->
        @if (viewMode() === 'canvas') {
          <div class="canvas-viewport">
            <div
              class="canvas-track"
              cdkDropList
              cdkDropListOrientation="horizontal"
              (cdkDropListDropped)="onEventDrop($event)"
            >
              <div class="axis-line"></div>

              @for (ev of filteredEvents(); track ev.id; let i = $index) {
                <div
                  class="canvas-node"
                  [class.above]="i % 2 === 0"
                  [class.below]="i % 2 !== 0"
                  cdkDrag
                >
                  <div class="node-connector"></div>
                  @if (ev.dateLabel) {
                    <span class="axis-label">{{ ev.dateLabel }}</span>
                  }
                  <app-timeline-event-card
                    [event]="ev"
                    [showActions]="true"
                    (edit)="openEventDialog($event)"
                    (delete)="confirmDeleteEvent($event)"
                  />
                </div>
              }

              @if (!filteredEvents().length) {
                <div class="canvas-empty">
                  <p>Sin eventos. Crea el primero con "+ Evento".</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- List mode -->
        @if (viewMode() === 'list') {
          <div class="list-viewport">
            <div class="list-header">
              <span class="col-num">#</span>
              <span class="col-date">Fecha</span>
              <span class="col-type">Tipo</span>
              <span class="col-rel">Relevancia</span>
              <span class="col-title">Titulo</span>
              <span class="col-refs">Referencias</span>
              <span class="col-acts">Acciones</span>
            </div>

            <div
              cdkDropList
              cdkDropListOrientation="vertical"
              (cdkDropListDropped)="onEventDrop($event)"
              class="list-body"
            >
              @for (ev of filteredEvents(); track ev.id; let i = $index) {
                <div class="list-row" cdkDrag>
                  <span class="col-num">{{ i + 1 }}</span>
                  <span class="col-date">{{ ev.dateLabel || '-' }}</span>
                  <span class="col-type">
                    <span
                      class="type-chip"
                      [style.background]="typeColor(ev.type) + '22'"
                      [style.color]="typeColor(ev.type)"
                    >
                      {{ typeIcon(ev.type) }} {{ typeLabel(ev.type) }}
                    </span>
                  </span>
                  <span class="col-rel">
                    <span class="rel-chip">{{ ev.relevance }}</span>
                  </span>
                  <span class="col-title">{{ ev.title }}</span>
                  <span class="col-refs">
                    @if (ev.chapter) {
                      <span class="ref-tag">📄</span>
                    }
                    @if (ev.character) {
                      <span class="ref-tag">🎭</span>
                    }
                    @if (ev.world) {
                      <span class="ref-tag">🌍</span>
                    }
                    @if (ev.wbEntry) {
                      <span class="ref-tag">📜</span>
                    }
                  </span>
                  <span class="col-acts">
                    <button type="button" class="row-btn" (click)="openEventDialog(ev)">
                      Editar
                    </button>
                    <button type="button" class="row-btn danger" (click)="confirmDeleteEvent(ev)">
                      Eliminar
                    </button>
                  </span>
                </div>
              }
            </div>

            @if (!filteredEvents().length) {
              <p class="list-empty">Sin eventos que coincidan con los filtros.</p>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [
    `
      .loading-shell {
        display: grid;
        place-items: center;
        min-height: 100vh;
        color: var(--text-2);
      }
      .canvas-shell {
        display: grid;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        min-height: 100vh;
        background: var(--bg-base);
      }

      /* ─── Topbar ─── */
      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding: 0.5rem 0.75rem;
        background: var(--bg-card);
        border-radius: 1rem;
        border: 1px solid var(--border);
      }
      .topbar-left,
      .topbar-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .back-btn {
        padding: 0.4rem 0.75rem;
        border-radius: 0.6rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        text-decoration: none;
        font-size: 0.8rem;
      }
      .back-btn:hover {
        color: var(--text-1);
      }
      .title-input {
        padding: 0.35rem 0.6rem;
        border-radius: 0.5rem;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text-1);
        font-size: 1.1rem;
        font-weight: 700;
        min-width: 200px;
      }
      .title-input:hover,
      .title-input:focus {
        border-color: var(--border);
        background: var(--bg-surface);
        outline: none;
      }
      .novel-badge {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.72rem;
        font-weight: 600;
      }
      .tb-btn {
        padding: 0.4rem 0.85rem;
        border-radius: 0.65rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.8rem;
        cursor: pointer;
      }
      .tb-btn:hover {
        border-color: var(--accent);
      }
      .tb-btn.primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: var(--accent);
      }
      .view-toggle {
        display: flex;
        border: 1px solid var(--border);
        border-radius: 0.6rem;
        overflow: hidden;
      }
      .toggle-opt {
        padding: 0.35rem 0.7rem;
        border: none;
        background: var(--bg-surface);
        color: var(--text-2);
        font-size: 0.75rem;
        cursor: pointer;
      }
      .toggle-opt.active {
        background: var(--accent-glow);
        color: var(--accent-text);
      }

      /* ─── Canvas mode ─── */
      .canvas-viewport {
        overflow-x: auto;
        overflow-y: hidden;
        padding: 2rem 0;
        min-height: 420px;
      }
      .canvas-track {
        display: flex;
        align-items: center;
        gap: 2rem;
        position: relative;
        min-width: max-content;
        padding: 0 2rem;
        min-height: 380px;
      }
      .axis-line {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 3px;
        background: var(--border-s);
        z-index: 0;
      }
      .canvas-node {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: grab;
      }
      .canvas-node.above {
        align-self: flex-start;
        margin-top: 0;
      }
      .canvas-node.below {
        align-self: flex-end;
        margin-bottom: 0;
      }
      .node-connector {
        width: 2px;
        height: 40px;
        background: var(--border-s);
      }
      .canvas-node.above .node-connector {
        order: 2;
      }
      .canvas-node.above app-timeline-event-card {
        order: 1;
      }
      .canvas-node.above .axis-label {
        order: 3;
      }
      .canvas-node.below .node-connector {
        order: 1;
      }
      .canvas-node.below app-timeline-event-card {
        order: 2;
      }
      .canvas-node.below .axis-label {
        order: 0;
      }
      .axis-label {
        font-size: 0.68rem;
        color: var(--text-3);
        padding: 0.15rem 0.4rem;
        border-radius: 0.3rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        white-space: nowrap;
      }
      .canvas-empty {
        display: grid;
        place-items: center;
        min-width: 300px;
        color: var(--text-3);
        z-index: 1;
      }

      /* CDK drag placeholder */
      .cdk-drag-preview {
        opacity: 0.85;
        box-shadow: var(--shadow);
      }
      .cdk-drag-placeholder {
        opacity: 0.3;
      }

      /* ─── List mode ─── */
      .list-viewport {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        overflow: hidden;
      }
      .list-header,
      .list-row {
        display: grid;
        grid-template-columns: 40px 100px 110px 90px 1fr 100px 130px;
        gap: 0.5rem;
        align-items: center;
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
      }
      .list-header {
        font-weight: 700;
        color: var(--text-2);
        border-bottom: 1px solid var(--border);
        background: var(--bg-surface);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .list-row {
        border-bottom: 1px solid var(--border);
        color: var(--text-1);
        cursor: grab;
      }
      .list-row:hover {
        background: var(--bg-surface);
      }
      .col-num {
        text-align: center;
        color: var(--text-3);
        font-size: 0.72rem;
      }
      .col-date {
        font-size: 0.75rem;
        color: var(--text-2);
      }
      .type-chip {
        font-size: 0.68rem;
        padding: 0.12rem 0.45rem;
        border-radius: 999px;
        font-weight: 600;
        white-space: nowrap;
      }
      .rel-chip {
        font-size: 0.65rem;
        color: var(--text-3);
        text-transform: uppercase;
      }
      .col-refs {
        display: flex;
        gap: 0.25rem;
      }
      .ref-tag {
        font-size: 0.85rem;
      }
      .col-acts {
        display: flex;
        gap: 0.3rem;
      }
      .row-btn {
        padding: 0.2rem 0.45rem;
        border-radius: 0.4rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-2);
        font-size: 0.7rem;
        cursor: pointer;
      }
      .row-btn:hover {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .row-btn.danger:hover {
        background: var(--danger);
        color: #fff;
      }
      .list-empty {
        padding: 2rem;
        text-align: center;
        color: var(--text-3);
      }

      @media (max-width: 768px) {
        .list-header,
        .list-row {
          grid-template-columns: 30px 80px 90px 70px 1fr 60px 100px;
          font-size: 0.72rem;
        }
      }
    `,
  ],
})
export class TimelineCanvasPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly timelineService = inject(TimelineService);

  readonly loading = signal(true);
  readonly timeline = signal<TimelineDetail | null>(null);
  readonly viewMode = signal<'canvas' | 'list'>('canvas');

  // All events (editable local copy)
  readonly allEvents = signal<TimelineEvent[]>([]);

  // Filters
  readonly filters = signal<TimelineFilters>({
    type: null,
    relevance: null,
    search: '',
  });

  readonly filteredEvents = computed(() => {
    let events = this.allEvents();
    const f = this.filters();
    if (f.type) events = events.filter((e) => e.type === f.type);
    if (f.relevance) events = events.filter((e) => e.relevance === f.relevance);
    if (f.search) {
      const q = f.search.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.dateLabel || '').toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q),
      );
    }
    return events.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  private titleTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/mis-timelines']);
      return;
    }
    this.loadTimeline(id);
  }

  timelineId(): string {
    return this.timeline()?.id || '';
  }

  onTitleChange(name: string) {
    if (this.titleTimeout !== null) {
      clearTimeout(this.titleTimeout);
    }
    this.titleTimeout = setTimeout(() => {
      if (!name.trim()) return;
      this.timelineService.update(this.timelineId(), { name: name.trim() }).subscribe();
    }, 800);
  }

  onFilterChange(f: TimelineFilters) {
    this.filters.set(f);
  }

  /* ─── Event CRUD ─── */

  openEventDialog(event?: TimelineEvent) {
    const data: TimelineEventFormData = {
      timelineId: this.timelineId(),
      novelSlug: this.timeline()?.novel?.slug || undefined,
      event: event || undefined,
    };

    const ref = this.dialog.open(TimelineEventFormDialogComponent, {
      width: '520px',
      data,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (event) {
        // Update
        this.timelineService.updateEvent(this.timelineId(), event.id, result).subscribe({
          next: (updated) => {
            this.allEvents.update((evts) => evts.map((e) => (e.id === updated.id ? updated : e)));
          },
        });
      } else {
        // Create
        const payload = { ...result, sortOrder: this.allEvents().length + 1 };
        this.timelineService.createEvent(this.timelineId(), payload).subscribe({
          next: (created) => {
            this.allEvents.update((evts) => [...evts, created]);
          },
        });
      }
    });
  }

  confirmDeleteEvent(event: TimelineEvent) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar evento',
        description: `Se eliminara "${event.title}". Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed !== 'true') return;
      this.timelineService.deleteEvent(this.timelineId(), event.id).subscribe({
        next: () => {
          this.allEvents.update((evts) => evts.filter((e) => e.id !== event.id));
        },
      });
    });
  }

  /* ─── Drag & Drop ─── */

  onEventDrop(event: CdkDragDrop<TimelineEvent[]>) {
    const events = [...this.filteredEvents()];
    moveItemInArray(events, event.previousIndex, event.currentIndex);
    const reordered = events.map((e, i) => ({ ...e, sortOrder: i + 1 }));
    this.allEvents.set(reordered);
    this.timelineService
      .reorderEvents(
        this.timelineId(),
        reordered.map((e) => ({ id: e.id, sortOrder: e.sortOrder })),
      )
      .subscribe();
  }

  /* ─── Export ─── */

  exportJson() {
    this.timelineService.exportTimeline(this.timelineId()).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-${this.timeline()?.name || 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ─── Helpers ─── */

  private readonly TYPE_COLORS: Record<string, string> = {
    WORLD_EVENT: '#3db05a',
    STORY_EVENT: '#3b82f6',
    CHARACTER_ARC: '#8b5cf6',
    CHAPTER_EVENT: '#22c55e',
    LORE_EVENT: '#c9a84c',
    NOTE: '#6b7280',
  };

  private readonly TYPE_ICONS: Record<string, string> = {
    WORLD_EVENT: '\u{1F30D}',
    STORY_EVENT: '\u{1F4D6}',
    CHARACTER_ARC: '\u{1F3AD}',
    CHAPTER_EVENT: '\u{1F4C4}',
    LORE_EVENT: '\u{1F4DC}',
    NOTE: '\u{1F4DD}',
  };

  private readonly TYPE_LABELS: Record<string, string> = {
    WORLD_EVENT: 'Mundo',
    STORY_EVENT: 'Historia',
    CHARACTER_ARC: 'Personaje',
    CHAPTER_EVENT: 'Capitulo',
    LORE_EVENT: 'Lore',
    NOTE: 'Nota',
  };

  typeColor(type: string) {
    return this.TYPE_COLORS[type] || '#6b7280';
  }
  typeIcon(type: string) {
    return this.TYPE_ICONS[type] || '';
  }
  typeLabel(type: string) {
    return this.TYPE_LABELS[type] || type;
  }

  private loadTimeline(id: string) {
    this.loading.set(true);
    this.timelineService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => {
          this.timeline.set(detail);
          this.allEvents.set(detail.events || []);
        },
        error: () => this.router.navigate(['/mis-timelines']),
      });
  }
}
