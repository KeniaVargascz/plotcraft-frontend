import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  WritingProjectSummary,
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../../core/models/writing-project.model';
import { WritingTask } from '../../core/models/writing-task.model';
import { PlannerService } from '../../core/services/planner.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { WordProgressBarComponent } from './components/word-progress-bar.component';
import { KanbanColumnComponent } from './components/kanban-column.component';
import {
  TaskFormDialogComponent,
  TaskFormDialogData,
} from './components/task-form-dialog.component';

const ALL_STATUSES: TaskStatus[] = ['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const ALL_PRIORITIES: TaskPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const ALL_TYPES: TaskType[] = [
  'CHAPTER',
  'CHARACTER',
  'WORLDBUILDING',
  'PLANNING',
  'REVISION',
  'RESEARCH',
  'PUBLICATION',
  'OTHER',
];

@Component({
  selector: 'app-kanban-board-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DragDropModule,
    LoadingSpinnerComponent,
    WordProgressBarComponent,
    KanbanColumnComponent,
  ],
  template: `
    @if (loading()) {
      <div class="loading-wrapper"><app-loading-spinner /></div>
    } @else {
      <div class="board-shell">
        <!-- Topbar -->
        <header class="board-topbar">
          <div class="topbar-left">
            <a class="back-btn" routerLink="/planner">&larr;</a>
            <div class="color-bar" [style.background]="project()?.color ?? 'var(--accent)'"></div>
            <input
              class="project-name-input"
              [(ngModel)]="projectName"
              (blur)="onNameBlur()"
              (keydown.enter)="$any($event.target).blur()"
            />
            @if (project()?.novel) {
              <span class="novel-badge">{{ project()!.novel!.title }}</span>
            }
          </div>

          <div class="topbar-center">
            <div class="word-bar-wrapper">
              <app-word-progress-bar [actual]="totalActualWords()" [target]="totalTargetWords()" />
            </div>
          </div>

          <div class="topbar-right">
            <button class="btn-new-task" (click)="openTaskDialog()">+ Nueva tarea</button>
            <a class="btn-stats" routerLink="/planner/estadisticas">Estadisticas</a>
          </div>
        </header>

        <!-- Filters -->
        <div class="filters-bar">
          <div class="filter-group">
            <span class="filter-label">Prioridad:</span>
            @for (p of allPriorities; track p) {
              <button
                class="chip"
                [class.active]="filterPriorities().has(p)"
                (click)="togglePriority(p)"
              >
                {{ priorityLabel(p) }}
              </button>
            }
          </div>

          <div class="filter-group">
            <span class="filter-label">Tipo:</span>
            @for (t of allTypes; track t) {
              <button class="chip" [class.active]="filterTypes().has(t)" (click)="toggleType(t)">
                {{ typeLabel(t) }}
              </button>
            }
          </div>

          <input
            class="search-input"
            type="text"
            placeholder="Buscar tareas..."
            [(ngModel)]="searchQuery"
          />

          <label class="overdue-toggle">
            <input type="checkbox" [(ngModel)]="showOverdueOnly" />
            Solo atrasadas
          </label>
        </div>

        <!-- Kanban columns -->
        <div class="kanban-area" cdkDropListGroup>
          @for (status of allStatuses; track status) {
            <app-kanban-column
              [status]="status"
              [tasks]="filteredColumn(status)"
              (taskClick)="openTaskDialog($event)"
              (taskDelete)="onDeleteTask($event)"
              (addTask)="openTaskDialog(undefined, status)"
              (dropped)="onDrop($event, status)"
            />
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .loading-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 80vh;
      }
      .board-shell {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
        background: var(--bg-base);
      }
      /* Topbar */
      .board-topbar {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        background: var(--bg-card);
        border-bottom: 1px solid var(--border);
        flex-wrap: wrap;
      }
      .topbar-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
      }
      .back-btn {
        font-size: 1.25rem;
        text-decoration: none;
        color: var(--text-2);
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
      }
      .back-btn:hover {
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .color-bar {
        width: 4px;
        height: 28px;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .project-name-input {
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 0.25rem 0.5rem;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-1);
        font-family: inherit;
        min-width: 120px;
        max-width: 400px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
      .project-name-input:hover {
        border-color: var(--border);
      }
      .project-name-input:focus {
        outline: none;
        border-color: var(--accent);
        background: var(--bg-base);
      }
      .novel-badge {
        font-size: 0.7rem;
        padding: 2px 8px;
        border-radius: 9999px;
        background: var(--bg-surface);
        color: var(--text-2);
        border: 1px solid var(--border);
        white-space: nowrap;
      }
      .topbar-center {
        flex: 1;
        max-width: 280px;
      }
      .word-bar-wrapper {
        width: 100%;
      }
      .topbar-right {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .btn-new-task {
        background: var(--accent);
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: filter 0.15s;
      }
      .btn-new-task:hover {
        filter: brightness(1.15);
      }
      .btn-new-task:hover {
        box-shadow: var(--accent-glow);
      }
      .btn-stats {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
        color: var(--text-2);
        text-decoration: none;
        white-space: nowrap;
      }
      .btn-stats:hover {
        border-color: var(--border-s);
      }
      /* Filters */
      .filters-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 1rem;
        background: var(--bg-card);
        border-bottom: 1px solid var(--border);
        overflow-x: auto;
        flex-wrap: wrap;
      }
      .filter-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .filter-label {
        font-size: 0.7rem;
        color: var(--text-3);
        font-weight: 600;
        white-space: nowrap;
      }
      .chip {
        font-size: 0.675rem;
        padding: 2px 8px;
        border-radius: 9999px;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-3);
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .chip:hover {
        border-color: var(--border-s);
        color: var(--text-1);
      }
      .chip.active {
        background: var(--accent);
        color: #fff;
        border-color: var(--accent);
      }
      .search-input {
        background: var(--bg-base);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.35rem 0.625rem;
        font-size: 0.8rem;
        color: var(--text-1);
        font-family: inherit;
        min-width: 160px;
        outline: none;
      }
      .search-input:focus {
        border-color: var(--accent);
      }
      .overdue-toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        color: var(--text-2);
        cursor: pointer;
        white-space: nowrap;
      }
      /* Kanban area */
      .kanban-area {
        flex: 1;
        display: flex;
        gap: 1rem;
        padding: 1rem;
        overflow-x: auto;
        overflow-y: hidden;
        align-items: flex-start;
      }
      /* CDK drag preview */
      :host ::ng-deep .cdk-drag-preview {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
        border-radius: 8px;
        opacity: 0.9;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly plannerService = inject(PlannerService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(true);
  projectId = '';
  project = signal<WritingProjectSummary | null>(null);
  projectName = '';

  allStatuses = ALL_STATUSES;
  allPriorities = ALL_PRIORITIES;
  allTypes = ALL_TYPES;

  board = signal<Record<string, WritingTask[]>>({
    BACKLOG: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
  });

  // Filters
  filterPriorities = signal(new Set<TaskPriority>());
  filterTypes = signal(new Set<TaskType>());
  searchQuery = '';
  showOverdueOnly = false;

  totalTargetWords = computed(() => {
    let total = 0;
    for (const tasks of Object.values(this.board())) {
      for (const t of tasks) {
        total += t.targetWords ?? 0;
      }
    }
    return total;
  });

  totalActualWords = computed(() => {
    let total = 0;
    for (const tasks of Object.values(this.board())) {
      for (const t of tasks) {
        total += t.actualWords ?? 0;
      }
    }
    return total;
  });

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') ?? '';
    this.loadBoard();
  }

  private loadBoard(): void {
    this.loading.set(true);

    this.plannerService.getProject(this.projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (p) => {
        this.project.set(p);
        this.projectName = p.name;
      },
    });

    this.plannerService.getBoard(this.projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.board.set(this.normalizeBoard(data));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredColumn(status: TaskStatus): WritingTask[] {
    const tasks = this.board()[status] ?? [];
    return tasks.filter((t) => {
      const fp = this.filterPriorities();
      if (fp.size > 0 && !fp.has(t.priority)) return false;

      const ft = this.filterTypes();
      if (ft.size > 0 && !ft.has(t.type)) return false;

      if (this.showOverdueOnly && !t.isOverdue) return false;

      const q = this.searchQuery.trim().toLowerCase();
      if (q && !t.title.toLowerCase().includes(q)) return false;

      return true;
    });
  }

  togglePriority(p: TaskPriority): void {
    this.filterPriorities.update((set) => {
      const next = new Set(set);
      if (next.has(p)) {
        next.delete(p);
      } else {
        next.add(p);
      }
      return next;
    });
  }

  toggleType(t: TaskType): void {
    this.filterTypes.update((set) => {
      const next = new Set(set);
      if (next.has(t)) {
        next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }

  priorityLabel(p: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'Critica',
      HIGH: 'Alta',
      MEDIUM: 'Media',
      LOW: 'Baja',
    };
    return map[p] ?? p;
  }

  typeLabel(t: string): string {
    const map: Record<string, string> = {
      CHAPTER: 'Cap.',
      CHARACTER: 'Pers.',
      WORLDBUILDING: 'Mundo',
      PLANNING: 'Plan.',
      REVISION: 'Rev.',
      RESEARCH: 'Inv.',
      PUBLICATION: 'Pub.',
      OTHER: 'Otro',
    };
    return map[t] ?? t;
  }

  onNameBlur(): void {
    const trimmed = this.projectName.trim();
    if (trimmed && trimmed !== this.project()?.name) {
      this.plannerService.updateProject(this.projectId, { name: trimmed }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (updated) => this.project.set(updated),
      });
    }
  }

  onDrop(event: CdkDragDrop<WritingTask[]>, targetStatus: TaskStatus): void {
    if (event.previousContainer === event.container) {
      // Reorder within same column
      const col = [...(this.board()[targetStatus] ?? [])];
      moveItemInArray(col, event.previousIndex, event.currentIndex);
      this.board.update((b) => ({ ...b, [targetStatus]: col }));

      const reorderPayload = col.map((t, i) => ({ id: t.id, sortOrder: i }));
      this.plannerService
        .reorderTasks(this.projectId, { tasks: reorderPayload, status: targetStatus })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    } else {
      // Move between columns
      const prevStatus = event.previousContainer.id as TaskStatus;
      const prevCol = [...(this.board()[prevStatus] ?? [])];
      const currCol = [...(this.board()[targetStatus] ?? [])];

      transferArrayItem(prevCol, currCol, event.previousIndex, event.currentIndex);

      this.board.update((b) => ({
        ...b,
        [prevStatus]: prevCol,
        [targetStatus]: currCol,
      }));

      const movedTask = currCol[event.currentIndex];
      this.plannerService
        .moveTask(this.projectId, movedTask.id, {
          status: targetStatus,
          sortOrder: event.currentIndex,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  openTaskDialog(task?: WritingTask, defaultStatus?: TaskStatus): void {
    const data: TaskFormDialogData = {
      projectId: this.projectId,
      task,
      defaultStatus: defaultStatus ?? 'BACKLOG',
      novelSlug: this.project()?.novel?.slug,
    };

    const ref = this.dialog.open(TaskFormDialogComponent, {
      panelClass: 'custom-dialog',
      data,
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (!result) return;

      if (task) {
        // Update existing task
        this.plannerService.updateTask(this.projectId, task.id, result).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (updated) => {
            this.board.update((b) => {
              const newBoard = { ...b };
              // Remove from old status column
              for (const status of ALL_STATUSES) {
                newBoard[status] = (newBoard[status] ?? []).filter((t) => t.id !== updated.id);
              }
              // Add to new status column
              const targetCol = newBoard[updated.status] ?? [];
              newBoard[updated.status] = [...targetCol, updated];
              return newBoard;
            });
          },
        });
      } else {
        // Create new task
        this.plannerService.createTask(this.projectId, result).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (created) => {
            const status = created.status;
            this.board.update((b) => ({
              ...b,
              [status]: [...(b[status] ?? []), created],
            }));
          },
        });
      }
    });
  }

  onDeleteTask(task: WritingTask): void {
    if (!confirm(`Eliminar tarea "${task.title}"?`)) return;
    this.plannerService.deleteTask(this.projectId, task.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.board.update((b) => {
          const newBoard = { ...b };
          for (const status of ALL_STATUSES) {
            newBoard[status] = (newBoard[status] ?? []).filter((t) => t.id !== task.id);
          }
          return newBoard;
        });
      },
    });
  }

  private normalizeBoard(
    data: Record<string, WritingTask[] | { tasks?: WritingTask[] }>,
  ): Record<string, WritingTask[]> {
    return {
      BACKLOG: this.extractColumn(data['BACKLOG']),
      IN_PROGRESS: this.extractColumn(data['IN_PROGRESS']),
      REVIEW: this.extractColumn(data['REVIEW']),
      DONE: this.extractColumn(data['DONE']),
    };
  }

  private extractColumn(
    column: WritingTask[] | { tasks?: WritingTask[] } | undefined,
  ): WritingTask[] {
    if (Array.isArray(column)) {
      return column;
    }

    return column?.tasks ?? [];
  }
}
