import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WritingProjectSummary } from '../../../core/models/writing-project.model';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card" [style.border-left-color]="project().color ?? 'var(--accent)'">
      <div class="card-body">
        <h3 class="card-title">{{ project().name }}</h3>

        @if (project().novel) {
          <span class="novel-chip">{{ project().novel!.title }}</span>
        }

        <div class="progress-row">
          <div class="progress-track">
            <div
              class="progress-fill"
              [style.width.%]="project().stats.completionPct"
            ></div>
          </div>
          <span class="pct">{{ project().stats.completionPct }}%</span>
        </div>

        <div class="stat-row">
          <span class="stat">{{ project().stats.byStatus.BACKLOG }} pendientes</span>
          <span class="stat">{{ project().stats.byStatus.IN_PROGRESS }} en progreso</span>
          <span class="stat">{{ project().stats.byStatus.REVIEW }} en revision</span>
        </div>

        @if (project().stats.overdue > 0) {
          <span class="overdue-badge">{{ project().stats.overdue }} atrasadas</span>
        }
      </div>

      <div class="card-actions">
        <a class="btn-link" [routerLink]="['/planner', project().id]">Abrir tablero</a>
        <div class="action-group">
          <button class="btn-action" (click)="edit.emit(project()); $event.stopPropagation()">Editar</button>
          <button class="btn-action" (click)="archive.emit(project()); $event.stopPropagation()">Archivar</button>
          <button class="btn-action danger" (click)="delete.emit(project()); $event.stopPropagation()">Eliminar</button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: 260px;
      max-width: 320px;
      box-shadow: var(--shadow);
      transition: border-color 0.2s;
    }
    .card:hover {
      border-color: var(--border-s);
    }
    .card-body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-1);
      margin: 0;
    }
    .novel-chip {
      display: inline-block;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 9999px;
      background: var(--bg-surface);
      color: var(--text-2);
      border: 1px solid var(--border);
      width: fit-content;
    }
    .progress-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .progress-track {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: var(--border);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
      background: var(--accent);
      transition: width 0.3s;
    }
    .pct {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--accent);
      min-width: 36px;
      text-align: right;
    }
    .stat-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .stat {
      font-size: 0.7rem;
      color: var(--text-3);
    }
    .overdue-badge {
      display: inline-block;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 9999px;
      background: color-mix(in srgb, var(--danger) 15%, transparent);
      color: var(--danger);
      width: fit-content;
      font-weight: 600;
    }
    .card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border);
      padding-top: 0.75rem;
    }
    .btn-link {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent);
      text-decoration: none;
    }
    .btn-link:hover {
      text-decoration: underline;
    }
    .action-group {
      display: flex;
      gap: 0.5rem;
    }
    .btn-action {
      background: none;
      border: none;
      font-size: 0.7rem;
      color: var(--text-3);
      cursor: pointer;
      padding: 2px 4px;
    }
    .btn-action:hover {
      color: var(--text-1);
    }
    .btn-action.danger:hover {
      color: var(--danger);
    }
  `],
})
export class ProjectCardComponent {
  project = input.required<WritingProjectSummary>();

  edit = output<WritingProjectSummary>();
  archive = output<WritingProjectSummary>();
  delete = output<WritingProjectSummary>();
}
