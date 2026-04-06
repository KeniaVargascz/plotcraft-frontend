import { Component, computed, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { WritingTask } from '../../../core/models/writing-task.model';
import { TaskStatus } from '../../../core/models/writing-project.model';
import { TaskCardComponent } from './task-card.component';

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: 'var(--text-2)',
  IN_PROGRESS: '#f59e0b',
  REVIEW: 'var(--accent)',
  DONE: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Pendientes',
  IN_PROGRESS: 'En progreso',
  REVIEW: 'En revision',
  DONE: 'Completadas',
};

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CdkDropList, CdkDrag, TaskCardComponent],
  template: `
    <div class="column">
      <div class="column-header">
        <div class="header-dot" [style.background]="statusColor()"></div>
        <h3 class="header-title">{{ statusLabel() }}</h3>
        <span class="header-count">{{ tasks().length }}</span>
      </div>

      <div
        class="column-body"
        cdkDropList
        [cdkDropListData]="tasks()"
        [id]="status()"
        (cdkDropListDropped)="dropped.emit($event)"
      >
        @for (task of tasks(); track task.id) {
          <app-task-card
            cdkDrag
            [cdkDragData]="task"
            [task]="task"
            (taskClick)="taskClick.emit($event)"
            (taskDelete)="taskDelete.emit($event)"
          />
        }

        @if (!tasks().length) {
          <div class="empty-col">Sin tareas</div>
        }
      </div>

      <button class="add-btn" (click)="addTask.emit()">+ Anadir tarea</button>
    </div>
  `,
  styles: [
    `
      .column {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        min-width: 280px;
        max-width: 320px;
        flex: 1;
        max-height: calc(100vh - 140px);
      }
      .column-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
      }
      .header-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .header-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-1);
        margin: 0;
        flex: 1;
      }
      .header-count {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-3);
        background: var(--bg-base);
        border-radius: 9999px;
        padding: 1px 8px;
      }
      .column-body {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-height: 60px;
      }
      .empty-col {
        text-align: center;
        color: var(--text-3);
        font-size: 0.8rem;
        padding: 2rem 0.5rem;
      }
      .add-btn {
        background: none;
        border: none;
        border-top: 1px solid var(--border);
        color: var(--text-3);
        font-size: 0.8rem;
        padding: 0.625rem;
        cursor: pointer;
        transition: color 0.15s;
      }
      .add-btn:hover {
        color: var(--accent);
      }
      /* CDK drag placeholder */
      :host ::ng-deep .cdk-drag-placeholder {
        opacity: 0.4;
        border: 2px dashed var(--border-s);
        border-radius: 8px;
      }
      :host ::ng-deep .cdk-drag-animating {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
})
export class KanbanColumnComponent {
  title = input<string>();
  color = input<string>();
  tasks = input.required<WritingTask[]>();
  status = input.required<TaskStatus>();

  taskClick = output<WritingTask>();
  taskDelete = output<WritingTask>();
  addTask = output<void>();
  dropped = output<CdkDragDrop<WritingTask[]>>();

  statusColor = computed(() => STATUS_COLORS[this.status()] ?? 'var(--text-2)');
  statusLabel = computed(() => STATUS_LABELS[this.status()] ?? this.status());
}
