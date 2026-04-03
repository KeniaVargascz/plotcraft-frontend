import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { WritingProjectSummary } from '../../core/models/writing-project.model';
import { WritingTask } from '../../core/models/writing-task.model';
import { PlannerStats } from '../../core/models/planner-stats.model';
import { PlannerService } from '../../core/services/planner.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { ProjectCardComponent } from './components/project-card.component';
import { CreateProjectDialogComponent } from './components/create-project-dialog.component';

@Component({
  selector: 'app-planner-dashboard-page',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ErrorMessageComponent, ProjectCardComponent],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <h1>Planner</h1>
          <p>Organiza y gestiona tus proyectos de escritura.</p>
        </div>
        <div class="header-actions">
          <a class="secondary" routerLink="/planner/calendario">Calendario</a>
          <a class="secondary" routerLink="/planner/estadisticas">Estadisticas</a>
          <button class="primary" (click)="openCreateDialog()">+ Nuevo proyecto</button>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <app-error-message />
      } @else {
        <!-- Projects horizontal scroll -->
        <section class="projects-section">
          <h2 class="section-title">Mis proyectos</h2>
          <div class="projects-scroll">
            @for (project of projects(); track project.id) {
              <app-project-card
                [project]="project"
                (edit)="onEditProject($event)"
                (archive)="onArchiveProject($event)"
                (delete)="onDeleteProject($event)"
              />
            }

            @if (!projects().length) {
              <div class="empty-card" (click)="openCreateDialog()">
                <span class="empty-icon">+</span>
                <span>Crea tu primer proyecto</span>
              </div>
            }
          </div>
        </section>

        <!-- Dashboard columns -->
        <div class="dashboard-grid">
          <!-- Urgent tasks (next 7 days) -->
          <div class="dash-col">
            <h3 class="col-title urgent-title">Tareas urgentes</h3>
            @for (task of urgentTasks(); track task.id) {
              <div class="mini-task" [routerLink]="['/planner', task.project.id]">
                <span class="mini-dot" [style.background]="priorityColor(task.priority)"></span>
                <span class="mini-title">{{ task.title }}</span>
                @if (task.dueDate) {
                  <span class="mini-due" [class.overdue]="task.isOverdue">
                    {{ formatDate(task.dueDate) }}
                  </span>
                }
              </div>
            }
            @if (!urgentTasks().length) {
              <p class="empty-text">Sin tareas urgentes</p>
            }
          </div>

          <!-- In progress -->
          <div class="dash-col">
            <h3 class="col-title progress-title">En progreso</h3>
            @for (task of inProgressTasks(); track task.id) {
              <div class="mini-task" [routerLink]="['/planner', task.project.id]">
                <span class="mini-dot" [style.background]="priorityColor(task.priority)"></span>
                <span class="mini-title">{{ task.title }}</span>
                <span class="mini-project">{{ task.project.name }}</span>
              </div>
            }
            @if (!inProgressTasks().length) {
              <p class="empty-text">Sin tareas en progreso</p>
            }
          </div>

          <!-- Recent completions -->
          <div class="dash-col">
            <h3 class="col-title done-title">Completadas recientemente</h3>
            @for (task of recentCompletions(); track task.id) {
              <div class="mini-task done-task" [routerLink]="['/planner', task.project.id]">
                <span class="mini-check">&#10003;</span>
                <span class="mini-title">{{ task.title }}</span>
              </div>
            }
            @if (!recentCompletions().length) {
              <p class="empty-text">Sin completadas recientes</p>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .page-shell {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-1);
      margin: 0;
    }
    .page-header p {
      color: var(--text-3);
      font-size: 0.875rem;
      margin: 0.25rem 0 0;
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .secondary {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      color: var(--text-2);
      text-decoration: none;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .secondary:hover {
      border-color: var(--border-s);
      color: var(--text-1);
    }
    .primary {
      background: var(--accent);
      border: none;
      border-radius: 8px;
      padding: 0.5rem 1.25rem;
      font-size: 0.85rem;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      transition: filter 0.15s;
    }
    .primary:hover {
      filter: brightness(1.15);
    }
    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-1);
      margin: 0 0 0.75rem;
    }
    .projects-scroll {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .projects-scroll::-webkit-scrollbar {
      height: 4px;
    }
    .projects-scroll::-webkit-scrollbar-thumb {
      background: var(--border-s);
      border-radius: 2px;
    }
    .empty-card {
      min-width: 260px;
      max-width: 320px;
      background: var(--bg-card);
      border: 2px dashed var(--border);
      border-radius: 10px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      color: var(--text-3);
      font-size: 0.85rem;
      transition: border-color 0.15s;
    }
    .empty-card:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .empty-icon {
      font-size: 2rem;
      font-weight: 300;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
    .dash-col {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .col-title {
      font-size: 0.85rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .urgent-title { color: var(--danger); }
    .progress-title { color: #f59e0b; }
    .done-title { color: #22c55e; }
    .mini-task {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.1s;
      text-decoration: none;
      color: inherit;
    }
    .mini-task:hover {
      background: var(--bg-surface);
    }
    .mini-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .mini-title {
      flex: 1;
      font-size: 0.8rem;
      color: var(--text-1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mini-due {
      font-size: 0.7rem;
      color: var(--text-3);
      white-space: nowrap;
    }
    .mini-due.overdue {
      color: var(--danger);
      font-weight: 600;
    }
    .mini-project {
      font-size: 0.65rem;
      color: var(--text-3);
      white-space: nowrap;
    }
    .mini-check {
      color: #22c55e;
      font-size: 0.8rem;
      flex-shrink: 0;
    }
    .done-task {
      opacity: 0.7;
    }
    .empty-text {
      font-size: 0.8rem;
      color: var(--text-3);
      text-align: center;
      padding: 1rem 0;
      margin: 0;
    }
  `],
})
export class PlannerDashboardPageComponent implements OnInit {
  private readonly plannerService = inject(PlannerService);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  error = signal(false);

  projects = signal<WritingProjectSummary[]>([]);
  urgentTasks = signal<WritingTask[]>([]);
  inProgressTasks = signal<WritingTask[]>([]);
  recentCompletions = signal<WritingTask[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(false);

    // Load projects
    this.plannerService.listProjects().subscribe({
      next: (projects) => this.projects.set(projects),
      error: () => this.error.set(true),
    });

    // Load calendar tasks (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const from = today.toISOString().substring(0, 10);
    const to = nextWeek.toISOString().substring(0, 10);

    this.plannerService.getCalendar(from, to).subscribe({
      next: (tasks) => this.urgentTasks.set(tasks.slice(0, 5)),
    });

    // Load stats for recent completions + in progress
    this.plannerService.getStats().subscribe({
      next: (stats) => {
        this.recentCompletions.set(stats.recentCompletions.slice(0, 5));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateProjectDialogComponent, {
      panelClass: 'custom-dialog',
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.plannerService.createProject(result).subscribe({
          next: (project) => this.projects.update((p) => [...p, project]),
        });
      }
    });
  }

  onEditProject(project: WritingProjectSummary): void {
    // Could open an edit dialog - for now reuse create
    const ref = this.dialog.open(CreateProjectDialogComponent, {
      panelClass: 'custom-dialog',
      data: project,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.plannerService.updateProject(project.id, result).subscribe({
          next: (updated) =>
            this.projects.update((list) =>
              list.map((p) => (p.id === updated.id ? updated : p)),
            ),
        });
      }
    });
  }

  onArchiveProject(project: WritingProjectSummary): void {
    this.plannerService.archiveProject(project.id).subscribe({
      next: () => this.projects.update((list) => list.filter((p) => p.id !== project.id)),
    });
  }

  onDeleteProject(project: WritingProjectSummary): void {
    if (!confirm(`Eliminar proyecto "${project.name}"?`)) return;
    this.plannerService.deleteProject(project.id).subscribe({
      next: () => this.projects.update((list) => list.filter((p) => p.id !== project.id)),
    });
  }

  priorityColor(priority: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'var(--danger)',
      HIGH: '#f59e0b',
      MEDIUM: 'var(--accent)',
      LOW: 'var(--text-3)',
    };
    return map[priority] ?? 'var(--text-3)';
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
