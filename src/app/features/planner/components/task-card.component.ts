import { Component, computed, input, output } from '@angular/core';
import { WritingTask } from '../../../core/models/writing-task.model';
import { WordProgressBarComponent } from './word-progress-bar.component';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'var(--danger)',
  HIGH: '#f59e0b',
  MEDIUM: 'var(--accent)',
  LOW: 'var(--text-3)',
};

const TYPE_ICONS: Record<string, string> = {
  CHAPTER: '\u{1F4D6}',
  CHARACTER: '\u{1F9D1}',
  WORLDBUILDING: '\u{1F30D}',
  PLANNING: '\u{1F4CB}',
  REVISION: '\u{1F50D}',
  RESEARCH: '\u{1F4DA}',
  PUBLICATION: '\u{1F680}',
  OTHER: '\u{1F4CC}',
};

const TYPE_LABELS: Record<string, string> = {
  CHAPTER: 'Capitulo',
  CHARACTER: 'Personaje',
  WORLDBUILDING: 'Mundo',
  PLANNING: 'Planificacion',
  REVISION: 'Revision',
  RESEARCH: 'Investigacion',
  PUBLICATION: 'Publicacion',
  OTHER: 'Otro',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [WordProgressBarComponent],
  template: `
    <article
      class="task-card"
      (click)="taskClick.emit(task())"
      (mouseenter)="hovered = true"
      (mouseleave)="hovered = false"
    >
      <div class="priority-bar" [style.background]="priorityColor()"></div>

      <div class="task-body">
        <h4 class="task-title">{{ task().title }}</h4>

        <div class="badge-row">
          <span class="type-badge">
            {{ typeIcon() }} {{ typeLabel() }}
          </span>
          <span class="priority-badge" [style.color]="priorityColor()">
            {{ priorityLabel() }}
          </span>
        </div>

        @if (task().dueDate) {
          <div class="due-date" [class.overdue]="task().isOverdue">
            <span class="cal-icon">&#128197;</span>
            {{ formatDate(task().dueDate!) }}
            @if (task().isOverdue) {
              <span class="overdue-icon">&#9888;&#65039;</span>
            }
          </div>
        }

        @if (task().targetWords && task().targetWords! > 0) {
          <app-word-progress-bar
            [actual]="task().actualWords ?? 0"
            [target]="task().targetWords!"
          />
        }

        @if (task().chapter || task().character) {
          <div class="ref-chips">
            @if (task().chapter) {
              <span class="ref-chip">{{ task().chapter!.title }}</span>
            }
            @if (task().character) {
              <span class="ref-chip">{{ task().character!.name }}</span>
            }
          </div>
        }

        @if (task().tags.length) {
          <div class="tags-row">
            @for (tag of displayTags(); track tag) {
              <span class="tag">{{ tag }}</span>
            }
            @if (task().tags.length > 2) {
              <span class="tag more">+{{ task().tags.length - 2 }}</span>
            }
          </div>
        }
      </div>

      @if (hovered) {
        <button class="delete-btn" (click)="onDelete($event)" title="Eliminar tarea">&#10005;</button>
      }
    </article>
  `,
  styles: [`
    .task-card {
      position: relative;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      cursor: grab;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .task-card:hover {
      border-color: var(--border-s);
      box-shadow: var(--shadow);
    }
    .task-card:active {
      cursor: grabbing;
    }
    .priority-bar {
      height: 3px;
      width: 100%;
    }
    .task-body {
      padding: 0.625rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .task-title {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-1);
      margin: 0;
      line-height: 1.3;
    }
    .badge-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .type-badge,
    .priority-badge {
      font-size: 0.675rem;
      padding: 1px 6px;
      border-radius: 4px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
    }
    .priority-badge {
      font-weight: 600;
    }
    .due-date {
      font-size: 0.7rem;
      color: var(--text-3);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .due-date.overdue {
      color: var(--danger);
      font-weight: 600;
    }
    .cal-icon {
      font-size: 0.8rem;
    }
    .overdue-icon {
      font-size: 0.8rem;
    }
    .ref-chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .ref-chip {
      font-size: 0.65rem;
      padding: 1px 6px;
      border-radius: 9999px;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      color: var(--accent);
      border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    }
    .tags-row {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .tag {
      font-size: 0.625rem;
      padding: 1px 5px;
      border-radius: 4px;
      background: var(--bg-surface);
      color: var(--text-3);
    }
    .tag.more {
      font-weight: 600;
      color: var(--text-2);
    }
    .delete-btn {
      position: absolute;
      top: 8px;
      right: 6px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--danger);
      font-size: 0.7rem;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }
    .delete-btn:hover {
      background: var(--danger);
      color: white;
    }
  `],
})
export class TaskCardComponent {
  task = input.required<WritingTask>();

  taskClick = output<WritingTask>();
  taskDelete = output<WritingTask>();

  hovered = false;

  priorityColor = computed(() => PRIORITY_COLORS[this.task().priority] ?? 'var(--text-3)');
  typeIcon = computed(() => TYPE_ICONS[this.task().type] ?? '');
  typeLabel = computed(() => TYPE_LABELS[this.task().type] ?? this.task().type);
  priorityLabel = computed(() => PRIORITY_LABELS[this.task().priority] ?? this.task().priority);

  displayTags = computed(() => this.task().tags.slice(0, 2));

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  onDelete(e: Event): void {
    e.stopPropagation();
    this.taskDelete.emit(this.task());
  }
}
