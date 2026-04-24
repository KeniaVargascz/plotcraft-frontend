import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ChapterSummary } from '../../../core/models/chapter.model';
import { CharacterSummary } from '../../../core/models/character.model';
import { WritingTask } from '../../../core/models/writing-task.model';
import { TaskPriority, TaskStatus, TaskType } from '../../../core/models/writing-project.model';
import { ChaptersService } from '../../../core/services/chapters.service';
import { CharactersService } from '../../../core/services/characters.service';
import { WordProgressBarComponent } from './word-progress-bar.component';

export interface TaskFormDialogData {
  task?: WritingTask;
  projectId: string;
  defaultStatus?: TaskStatus;
  novelSlug?: string;
}

type TaskDialogResult = Pick<
  WritingTask,
  'title' | 'description' | 'type' | 'priority' | 'status' | 'tags'
> & {
  dueDate: string | null;
  targetWords?: number | null;
  actualWords?: number | null;
  chapterId?: string;
  characterId?: string;
};

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'CHAPTER', label: 'Capitulo' },
  { value: 'CHARACTER', label: 'Personaje' },
  { value: 'WORLDBUILDING', label: 'Mundo' },
  { value: 'PLANNING', label: 'Planificacion' },
  { value: 'REVISION', label: 'Revision' },
  { value: 'RESEARCH', label: 'Investigacion' },
  { value: 'PUBLICATION', label: 'Publicacion' },
  { value: 'OTHER', label: 'Otro' },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'CRITICAL', label: 'Critica', color: 'var(--danger)' },
  { value: 'HIGH', label: 'Alta', color: '#f59e0b' },
  { value: 'MEDIUM', label: 'Media', color: 'var(--accent)' },
  { value: 'LOW', label: 'Baja', color: 'var(--text-3)' },
];

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'REVIEW', label: 'En revision' },
  { value: 'DONE', label: 'Completada' },
];

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, WordProgressBarComponent],
  template: `
    <h2 mat-dialog-title>{{ data.task ? 'Editar tarea' : 'Nueva tarea' }}</h2>

    <mat-dialog-content>
      <div class="form-grid">
        <!-- Section: Task -->
        <section class="form-section">
          <h3 class="section-title">Tarea</h3>

          <label class="field">
            <span class="field-label">Titulo *</span>
            <input type="text" [(ngModel)]="title" placeholder="Titulo de la tarea" />
          </label>

          <label class="field">
            <span class="field-label">Descripcion</span>
            <textarea
              [(ngModel)]="description"
              rows="3"
              placeholder="Descripcion opcional"
            ></textarea>
          </label>

          <div class="field-row">
            <label class="field">
              <span class="field-label">Tipo</span>
              <select [(ngModel)]="type">
                @for (t of taskTypes; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="field-label">Prioridad</span>
              <select [(ngModel)]="priority" [style.color]="selectedPriorityColor()">
                @for (p of priorities; track p.value) {
                  <option [value]="p.value" [style.color]="p.color">{{ p.label }}</option>
                }
              </select>
            </label>
          </div>

          <div class="field-row">
            <label class="field">
              <span class="field-label">Estado</span>
              <select [(ngModel)]="status">
                @for (s of statuses; track s.value) {
                  <option [value]="s.value">{{ s.label }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="field-label">Fecha limite</span>
              <input type="date" [(ngModel)]="dueDate" />
            </label>
          </div>

          <label class="field">
            <span class="field-label">Etiquetas (separadas por coma)</span>
            <input type="text" [(ngModel)]="tagsStr" placeholder="etiqueta1, etiqueta2" />
          </label>
        </section>

        <!-- Section: Words (only for CHAPTER type) -->
        @if (type === 'CHAPTER') {
          <section class="form-section">
            <h3 class="section-title">Palabras</h3>

            <div class="field-row">
              <label class="field">
                <span class="field-label">Meta de palabras</span>
                <input type="number" [(ngModel)]="targetWords" min="0" />
              </label>

              <label class="field">
                <span class="field-label">Palabras escritas</span>
                <input type="number" [(ngModel)]="actualWords" min="0" />
              </label>
            </div>

            @if (targetWords > 0) {
              <app-word-progress-bar [actual]="actualWords" [target]="targetWords" />
            }
          </section>
        }

        <!-- Section: References -->
        <section class="form-section">
          <h3 class="section-title">Referencias</h3>

          @if (data.novelSlug) {
            <label class="field">
              <span class="field-label">Capitulo (opcional)</span>
              <select [(ngModel)]="chapterId" (focus)="loadChapters()">
                <option value="">Sin capitulo</option>
                @for (ch of chapters(); track ch.id) {
                  <option [value]="ch.id">{{ ch.order }}. {{ ch.title }}</option>
                }
              </select>
            </label>
          }

          <label class="field">
            <span class="field-label">Personaje (opcional)</span>
            <select [(ngModel)]="characterId" (focus)="loadCharacters()">
              <option value="">Sin personaje</option>
              @for (c of charactersList(); track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
          </label>
        </section>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button class="btn-cancel" (click)="onCancel()">Cancelar</button>
      <button class="btn-save" [disabled]="!title.trim()" (click)="onSave()">
        {{ data.task ? 'Guardar cambios' : 'Crear tarea' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(560px, 90vw);
      }
      h2[mat-dialog-title] {
        color: var(--text-1);
        font-size: 1.15rem;
        margin: 0;
        padding: 1rem 1.25rem 0.5rem;
      }
      mat-dialog-content {
        padding: 0 1.25rem;
        max-height: 65vh;
        overflow-y: auto;
      }
      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding-bottom: 0.5rem;
      }
      .form-section {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }
      .section-title {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-2);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0;
        padding-bottom: 0.25rem;
        border-bottom: 1px solid var(--border);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }
      .field-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-2);
      }
      .field-row {
        display: flex;
        gap: 0.75rem;
      }
      input,
      textarea,
      select {
        background: var(--bg-base);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.5rem 0.625rem;
        font-size: 0.85rem;
        color: var(--text-1);
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s;
      }
      input:focus,
      textarea:focus,
      select:focus {
        border-color: var(--accent);
      }
      textarea {
        resize: vertical;
      }
      mat-dialog-actions {
        padding: 0.75rem 1.25rem;
        gap: 0.5rem;
      }
      .btn-cancel {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
        color: var(--text-2);
        cursor: pointer;
      }
      .btn-cancel:hover {
        border-color: var(--border-s);
      }
      .btn-save {
        background: var(--accent);
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1.25rem;
        font-size: 0.85rem;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        transition: filter 0.15s;
      }
      .btn-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-save:hover:not(:disabled) {
        box-shadow: var(--accent-glow);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialogComponent implements OnInit {
  readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TaskFormDialogComponent>);
  private readonly chaptersService = inject(ChaptersService);
  private readonly charactersService = inject(CharactersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly chapters = signal<{ id: string; title: string; order: number }[]>([]);
  readonly charactersList = signal<{ id: string; name: string }[]>([]);
  private chaptersLoaded = false;
  private charactersLoaded = false;

  taskTypes = TASK_TYPES;
  priorities = PRIORITIES;
  statuses = STATUSES;

  title = '';
  description = '';
  type: TaskType = 'CHAPTER';
  priority: TaskPriority = 'MEDIUM';
  status: TaskStatus = 'BACKLOG';
  dueDate = '';
  tagsStr = '';
  targetWords = 0;
  actualWords = 0;
  chapterId = '';
  characterId = '';

  selectedPriorityColor = computed(() => {
    const found = PRIORITIES.find((p) => p.value === this.priority);
    return found?.color ?? 'var(--text-1)';
  });

  ngOnInit(): void {
    const t = this.data.task;
    if (t) {
      this.title = t.title;
      this.description = t.description ?? '';
      this.type = t.type;
      this.priority = t.priority;
      this.status = t.status;
      this.dueDate = t.dueDate ? t.dueDate.substring(0, 10) : '';
      this.tagsStr = t.tags.join(', ');
      this.targetWords = t.targetWords ?? 0;
      this.actualWords = t.actualWords ?? 0;
      this.chapterId = t.chapter?.id ?? '';
      this.characterId = t.character?.id ?? '';
    } else {
      if (this.data.defaultStatus) {
        this.status = this.data.defaultStatus;
      }
    }
  }

  loadChapters(): void {
    if (this.chaptersLoaded || !this.data.novelSlug) return;
    this.chaptersLoaded = true;
    this.chaptersService.listDrafts(this.data.novelSlug, { limit: 50 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) =>
        this.chapters.set(
          res.data.map((chapter: ChapterSummary) => ({
            id: chapter.id,
            title: chapter.title,
            order: chapter.order,
          })),
        ),
      error: () => this.chapters.set([]),
    });
  }

  loadCharacters(): void {
    if (this.charactersLoaded) return;
    this.charactersLoaded = true;
    this.charactersService.listMine({ limit: 50 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) =>
        this.charactersList.set(
          res.data.map((character: CharacterSummary) => ({
            id: character.id,
            name: character.name,
          })),
        ),
      error: () => this.charactersList.set([]),
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    const tags = this.tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const result: TaskDialogResult = {
      title: this.title.trim(),
      description: this.description.trim() || null,
      type: this.type,
      priority: this.priority,
      status: this.status,
      dueDate: this.dueDate || null,
      tags,
    };

    if (this.type === 'CHAPTER') {
      result.targetWords = this.targetWords || null;
      result.actualWords = this.actualWords || null;
    }

    if (this.chapterId.trim()) {
      result.chapterId = this.chapterId.trim();
    }
    if (this.characterId.trim()) {
      result.characterId = this.characterId.trim();
    }

    this.dialogRef.close(result);
  }
}
