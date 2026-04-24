import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { WritingTask } from '../../core/models/writing-task.model';
import { PlannerService } from '../../core/services/planner.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

interface CalendarDay {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: WritingTask[];
}

const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'var(--danger)',
  HIGH: '#f59e0b',
  MEDIUM: 'var(--accent)',
  LOW: 'var(--text-3)',
};

@Component({
  selector: 'app-planner-calendar-page',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="calendar-shell">
      <header class="calendar-header">
        <a class="back-btn" routerLink="/planner">&larr; Planner</a>
        <div class="nav-row">
          <button class="nav-btn" (click)="prevMonth()">&lsaquo;</button>
          <h2 class="month-title">{{ monthName() }} {{ year() }}</h2>
          <button class="nav-btn" (click)="nextMonth()">&rsaquo;</button>
        </div>
        <button class="today-btn" (click)="goToday()">Hoy</button>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="calendar-grid-wrapper">
          <!-- Day headers -->
          <div class="day-headers">
            @for (d of dayNames; track d) {
              <div class="day-header">{{ d }}</div>
            }
          </div>

          <!-- Day cells -->
          <div class="day-grid">
            @for (day of calendarDays(); track day.date.toISOString()) {
              <div
                class="day-cell"
                [class.other-month]="!day.isCurrentMonth"
                [class.today]="day.isToday"
                [class.has-tasks]="day.tasks.length > 0"
                (click)="selectDay(day)"
              >
                <span class="day-num">{{ day.dayNum }}</span>
                <div class="task-dots">
                  @for (task of day.tasks.slice(0, 3); track task.id) {
                    <div class="task-dot" [style.background]="priorityColor(task.priority)">
                      <span class="dot-title">{{ task.title }}</span>
                    </div>
                  }
                  @if (day.tasks.length > 3) {
                    <span class="more-indicator">+{{ day.tasks.length - 3 }} mas</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Side panel -->
        @if (selectedDay()) {
          <div class="side-panel" (click)="selectedDay.set(null)">
            <div class="panel-content" (click)="$event.stopPropagation()">
              <div class="panel-header">
                <h3>{{ formatDayHeader(selectedDay()!.date) }}</h3>
                <button class="close-btn" (click)="selectedDay.set(null)">&times;</button>
              </div>

              @if (selectedDay()!.tasks.length) {
                <div class="panel-tasks">
                  @for (task of selectedDay()!.tasks; track task.id) {
                    <a class="panel-task" [routerLink]="['/planner', task.project.id]">
                      <span class="p-dot" [style.background]="priorityColor(task.priority)"></span>
                      <div class="p-info">
                        <span class="p-title">{{ task.title }}</span>
                        <span class="p-meta">{{ task.project.name }} &middot; {{ task.type }}</span>
                      </div>
                      @if (task.isOverdue) {
                        <span class="p-overdue">Atrasada</span>
                      }
                    </a>
                  }
                </div>
              } @else {
                <p class="panel-empty">Sin tareas para este dia.</p>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .calendar-shell {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
        max-width: 1100px;
        margin: 0 auto;
        position: relative;
      }
      .calendar-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .back-btn {
        font-size: 0.85rem;
        color: var(--text-2);
        text-decoration: none;
      }
      .back-btn:hover {
        color: var(--text-1);
      }
      .nav-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        justify-content: center;
      }
      .nav-btn {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.25rem 0.75rem;
        font-size: 1.25rem;
        color: var(--text-2);
        cursor: pointer;
      }
      .nav-btn:hover {
        border-color: var(--border-s);
        color: var(--text-1);
      }
      .month-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-1);
        margin: 0;
        min-width: 180px;
        text-align: center;
      }
      .today-btn {
        background: var(--accent);
        border: none;
        border-radius: 6px;
        padding: 0.375rem 1rem;
        font-size: 0.8rem;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        transition: filter 0.15s;
      }
      .today-btn:hover {
        filter: brightness(1.15);
      }
      .calendar-grid-wrapper {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 10px;
        overflow: hidden;
      }
      .day-headers {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border-bottom: 1px solid var(--border);
      }
      .day-header {
        text-align: center;
        padding: 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-3);
        text-transform: uppercase;
      }
      .day-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
      }
      .day-cell {
        min-height: 90px;
        padding: 0.375rem;
        border-right: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        cursor: pointer;
        transition: background 0.1s;
      }
      .day-cell:nth-child(7n) {
        border-right: none;
      }
      .day-cell:hover {
        background: var(--bg-surface);
      }
      .day-cell.other-month {
        opacity: 0.35;
      }
      .day-cell.today .day-num {
        background: var(--accent);
        color: #fff;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .day-num {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-1);
        display: block;
        margin-bottom: 4px;
      }
      .task-dots {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .task-dot {
        border-radius: 3px;
        padding: 1px 4px;
        overflow: hidden;
      }
      .dot-title {
        font-size: 0.6rem;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
      }
      .more-indicator {
        font-size: 0.6rem;
        color: var(--text-3);
        font-weight: 600;
      }
      /* Side panel */
      .side-panel {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: var(--z-overlay);
        display: flex;
        justify-content: flex-end;
      }
      .panel-content {
        width: min(400px, 90vw);
        background: var(--bg-card);
        border-left: 1px solid var(--border);
        height: 100%;
        overflow-y: auto;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .panel-header h3 {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-1);
        margin: 0;
      }
      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--text-3);
        cursor: pointer;
      }
      .close-btn:hover {
        color: var(--text-1);
      }
      .panel-tasks {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .panel-task {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.15s;
      }
      .panel-task:hover {
        border-color: var(--border-s);
      }
      .p-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .p-info {
        flex: 1;
        min-width: 0;
      }
      .p-title {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .p-meta {
        font-size: 0.7rem;
        color: var(--text-3);
      }
      .p-overdue {
        font-size: 0.65rem;
        padding: 2px 6px;
        border-radius: 4px;
        background: color-mix(in srgb, var(--danger) 15%, transparent);
        color: var(--danger);
        font-weight: 600;
        white-space: nowrap;
      }
      .panel-empty {
        color: var(--text-3);
        font-size: 0.85rem;
        text-align: center;
        padding: 2rem 0;
        margin: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerCalendarPageComponent implements OnInit {
  private readonly plannerService = inject(PlannerService);
  private readonly destroyRef = inject(DestroyRef);

  dayNames = DAY_NAMES;
  loading = signal(true);

  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());
  tasks = signal<WritingTask[]>([]);
  selectedDay = signal<CalendarDay | null>(null);

  monthName = computed(() => MONTH_NAMES[this.currentMonth()]);
  year = computed(() => this.currentYear());

  calendarDays = computed(() => {
    const month = this.currentMonth();
    const year = this.currentYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0 start
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: CalendarDay[] = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(this.makeDay(d, false, todayStr));
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push(this.makeDay(d, true, todayStr));
    }

    // Next month padding (fill to complete weeks)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push(this.makeDay(d, false, todayStr));
      }
    }

    return days;
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  private makeDay(date: Date, isCurrentMonth: boolean, todayStr: string): CalendarDay {
    const dayStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const dateKey = this.toLocalDateStr(date);
    const dayTasks = this.tasks().filter((t) => {
      if (!t.dueDate) return false;
      return this.toLocalDateStr(new Date(t.dueDate)) === dateKey;
    });

    return {
      date,
      dayNum: date.getDate(),
      isCurrentMonth,
      isToday: dayStr === todayStr,
      tasks: dayTasks,
    };
  }

  private toLocalDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private loadTasks(): void {
    this.loading.set(true);
    const year = this.currentYear();
    const month = this.currentMonth();
    const from = new Date(year, month, 1).toISOString().substring(0, 10);
    const to = new Date(year, month + 1, 0).toISOString().substring(0, 10);

    this.plannerService.getCalendar(from, to).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: WritingTask[]) => {
        this.tasks.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.tasks.set([]);
        this.loading.set(false);
      },
    });
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update((y) => y - 1);
    } else {
      this.currentMonth.update((m) => m - 1);
    }
    this.loadTasks();
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update((y) => y + 1);
    } else {
      this.currentMonth.update((m) => m + 1);
    }
    this.loadTasks();
  }

  goToday(): void {
    const now = new Date();
    this.currentMonth.set(now.getMonth());
    this.currentYear.set(now.getFullYear());
    this.loadTasks();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay.set(day);
  }

  priorityColor(priority: string): string {
    return PRIORITY_COLORS[priority] ?? 'var(--text-3)';
  }

  formatDayHeader(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}
