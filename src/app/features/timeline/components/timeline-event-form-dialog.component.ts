import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  TimelineEvent,
  TimelineEventType,
  TimelineEventRelevance,
} from '../../../core/models/timeline.model';
import { ChaptersService } from '../../../core/services/chapters.service';
import { CharactersService } from '../../../core/services/characters.service';
import { WorldsService } from '../../../core/services/worlds.service';
import { WorldbuildingService } from '../../../core/services/worldbuilding.service';

export interface TimelineEventFormData {
  event?: TimelineEvent;
  timelineId: string;
  novelSlug?: string;
}

const EVENT_TYPES: { value: TimelineEventType; label: string; icon: string }[] = [
  { value: 'WORLD_EVENT', label: 'Evento del mundo', icon: '\u{1F30D}' },
  { value: 'STORY_EVENT', label: 'Evento de historia', icon: '\u{1F4D6}' },
  { value: 'CHARACTER_ARC', label: 'Arco de personaje', icon: '\u{1F3AD}' },
  { value: 'CHAPTER_EVENT', label: 'Evento de capitulo', icon: '\u{1F4C4}' },
  { value: 'LORE_EVENT', label: 'Lore', icon: '\u{1F4DC}' },
  { value: 'NOTE', label: 'Nota', icon: '\u{1F4DD}' },
];

const RELEVANCES: { value: TimelineEventRelevance; label: string; desc: string }[] = [
  { value: 'CRITICAL', label: 'Critico', desc: 'Punto de inflexion clave en la historia' },
  { value: 'MAJOR', label: 'Mayor', desc: 'Evento importante que afecta la trama' },
  { value: 'MINOR', label: 'Menor', desc: 'Detalle secundario pero relevante' },
  { value: 'BACKGROUND', label: 'Fondo', desc: 'Contexto o ambientacion' },
];

const COLOR_SWATCHES = [
  '#3db05a',
  '#3b82f6',
  '#8b5cf6',
  '#22c55e',
  '#c9a84c',
  '#ef4444',
  '#f59e0b',
  '#ec4899',
  '#6b7280',
];

@Component({
  selector: 'app-timeline-event-form-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar evento' : 'Nuevo evento' }}</h2>

    <mat-dialog-content>
      <div class="form-grid">
        <!-- Section 1: Content -->
        <h3 class="section-title">Contenido</h3>

        <label class="field">
          <span class="label">Titulo <span class="req">*</span></span>
          <input type="text" [(ngModel)]="title" placeholder="Titulo del evento" />
        </label>

        <label class="field">
          <span class="label">Etiqueta de fecha</span>
          <input type="text" [(ngModel)]="dateLabel" placeholder="Ej: Ano 1042, Cap 3, Dia 15..." />
          <span class="hint">Texto libre para ubicar el evento en el tiempo</span>
        </label>

        <label class="field">
          <span class="label">Descripcion</span>
          <textarea
            [(ngModel)]="description"
            rows="3"
            placeholder="Descripcion del evento..."
          ></textarea>
        </label>

        <div class="field">
          <span class="label">Color</span>
          <div class="color-row">
            <input type="text" [(ngModel)]="color" placeholder="#hex" class="color-input" />
            <div class="swatches">
              @for (sw of swatches; track sw) {
                <button
                  type="button"
                  class="swatch"
                  [style.background]="sw"
                  [class.active]="color === sw"
                  (click)="color = sw"
                ></button>
              }
            </div>
          </div>
        </div>

        <!-- Section 2: Classification -->
        <h3 class="section-title">Clasificacion</h3>

        <label class="field">
          <span class="label">Tipo</span>
          <select [(ngModel)]="type">
            @for (t of eventTypes; track t.value) {
              <option [value]="t.value">{{ t.icon }} {{ t.label }}</option>
            }
          </select>
        </label>

        <label class="field">
          <span class="label">Relevancia</span>
          <select [(ngModel)]="relevance">
            @for (r of relevances; track r.value) {
              <option [value]="r.value">{{ r.label }} - {{ r.desc }}</option>
            }
          </select>
        </label>

        <!-- Section 3: References (collapsible) -->
        <button type="button" class="section-toggle" (click)="refsOpen = !refsOpen">
          {{ refsOpen ? '▼' : '▶' }} Referencias
        </button>

        @if (refsOpen) {
          <div class="refs-section">
            @if (data.novelSlug) {
              <label class="field">
                <span class="label">Capitulo</span>
                <select [(ngModel)]="chapterId" (focus)="loadChapters()">
                  <option [ngValue]="null">-- Ninguno --</option>
                  @for (ch of chapters(); track ch.id) {
                    <option [value]="ch.id">#{{ ch.order }} {{ ch.title }}</option>
                  }
                </select>
              </label>
            }

            <label class="field">
              <span class="label">Personaje</span>
              <select [(ngModel)]="characterId" (focus)="loadCharacters()">
                <option [ngValue]="null">-- Ninguno --</option>
                @for (c of characters(); track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="label">Mundo</span>
              <select
                [(ngModel)]="worldId"
                (focus)="loadWorlds()"
                (ngModelChange)="onWorldChange()"
              >
                <option [ngValue]="null">-- Ninguno --</option>
                @for (w of worlds(); track w.id) {
                  <option [value]="w.id">{{ w.name }}</option>
                }
              </select>
            </label>

            @if (worldId) {
              <label class="field">
                <span class="label">Entrada de world-building</span>
                <select [(ngModel)]="wbEntryId" (focus)="loadWbEntries()">
                  <option [ngValue]="null">-- Ninguna --</option>
                  @for (e of wbEntries(); track e.id) {
                    <option [value]="e.id">{{ e.name }}</option>
                  }
                </select>
              </label>
            }

            <label class="field">
              <span class="label">Tags</span>
              <input type="text" [(ngModel)]="tagsInput" placeholder="tag1, tag2, tag3..." />
              <span class="hint">Separados por coma</span>
            </label>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button type="button" class="btn-cancel" mat-dialog-close>Cancelar</button>
      <button type="button" class="btn-save" [disabled]="!title.trim()" (click)="save()">
        {{ isEdit ? 'Guardar cambios' : 'Crear evento' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        max-height: 70vh;
      }
      .form-grid {
        display: grid;
        gap: 0.75rem;
      }
      .section-title {
        margin: 0.5rem 0 0;
        font-size: 0.85rem;
        color: var(--text-2);
        border-bottom: 1px solid var(--border);
        padding-bottom: 0.3rem;
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
      .hint {
        font-size: 0.68rem;
        color: var(--text-3);
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
      .color-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .color-input {
        width: 90px;
      }
      .swatches {
        display: flex;
        gap: 0.3rem;
        flex-wrap: wrap;
      }
      .swatch {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: border-color 0.15s;
      }
      .swatch:hover,
      .swatch.active {
        border-color: var(--text-1);
      }
      .section-toggle {
        background: none;
        border: none;
        color: var(--text-2);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        padding: 0.4rem 0;
      }
      .section-toggle:hover {
        color: var(--accent);
      }
      .refs-section {
        display: grid;
        gap: 0.75rem;
        padding-left: 0.5rem;
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
})
export class TimelineEventFormDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<TimelineEventFormDialogComponent>);
  readonly data = inject<TimelineEventFormData>(MAT_DIALOG_DATA);

  private readonly chaptersService = inject(ChaptersService);
  private readonly charactersService = inject(CharactersService);
  private readonly worldsService = inject(WorldsService);
  private readonly wbService = inject(WorldbuildingService);

  readonly eventTypes = EVENT_TYPES;
  readonly relevances = RELEVANCES;
  readonly swatches = COLOR_SWATCHES;

  isEdit = false;
  refsOpen = false;

  // form fields
  title = '';
  dateLabel = '';
  description = '';
  color = '';
  type: TimelineEventType = 'STORY_EVENT';
  relevance: TimelineEventRelevance = 'MAJOR';
  chapterId: string | null = null;
  characterId: string | null = null;
  worldId: string | null = null;
  wbEntryId: string | null = null;
  tagsInput = '';

  // lazy-loaded options
  readonly chapters = signal<{ id: string; title: string; order: number }[]>([]);
  readonly characters = signal<{ id: string; name: string }[]>([]);
  readonly worlds = signal<{ id: string; slug: string; name: string }[]>([]);
  readonly wbEntries = signal<{ id: string; name: string }[]>([]);

  private chaptersLoaded = false;
  private charactersLoaded = false;
  private worldsLoaded = false;
  private wbSlug: string | null = null;

  ngOnInit() {
    const ev = this.data.event;
    if (ev) {
      this.isEdit = true;
      this.title = ev.title;
      this.dateLabel = ev.dateLabel || '';
      this.description = ev.description || '';
      this.color = ev.color || '';
      this.type = ev.type;
      this.relevance = ev.relevance;
      this.chapterId = ev.chapter?.id || null;
      this.characterId = ev.character?.id || null;
      this.worldId = ev.world?.id || null;
      this.wbEntryId = ev.wbEntry?.id || null;
      this.tagsInput = ev.tags?.join(', ') || '';
      if (this.chapterId || this.characterId || this.worldId || this.wbEntryId || ev.tags?.length) {
        this.refsOpen = true;
      }
    }
  }

  loadChapters() {
    if (this.chaptersLoaded || !this.data.novelSlug) return;
    this.chaptersLoaded = true;
    this.chaptersService.listDrafts(this.data.novelSlug, { limit: 100 }).subscribe({
      next: (res) =>
        this.chapters.set(res.data.map((c) => ({ id: c.id, title: c.title, order: c.order }))),
    });
  }

  loadCharacters() {
    if (this.charactersLoaded) return;
    this.charactersLoaded = true;
    this.charactersService.listMine({ limit: 100 }).subscribe({
      next: (res) => this.characters.set(res.data.map((c) => ({ id: c.id, name: c.name }))),
    });
  }

  loadWorlds() {
    if (this.worldsLoaded) return;
    this.worldsLoaded = true;
    this.worldsService.listMine({ limit: 50 }).subscribe({
      next: (res) =>
        this.worlds.set(res.data.map((w) => ({ id: w.id, slug: w.slug, name: w.name }))),
    });
  }

  onWorldChange() {
    this.wbEntryId = null;
    this.wbEntries.set([]);
    this.wbSlug = null;
  }

  loadWbEntries() {
    const selected = this.worlds().find((w) => w.id === this.worldId);
    if (!selected || this.wbSlug === selected.slug) return;
    this.wbSlug = selected.slug;
    this.wbService.listEntries(selected.slug, { limit: 100 }).subscribe({
      next: (res) => this.wbEntries.set(res.data.map((e) => ({ id: e.id, name: e.name }))),
    });
  }

  save() {
    if (!this.title.trim()) return;
    const tags = this.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Record<string, unknown> = {
      title: this.title.trim(),
      dateLabel: this.dateLabel.trim() || null,
      description: this.description.trim() || null,
      color: this.color.trim() || null,
      type: this.type,
      relevance: this.relevance,
      chapterId: this.chapterId || null,
      characterId: this.characterId || null,
      worldId: this.worldId || null,
      wbEntryId: this.wbEntryId || null,
      tags,
    };

    this.dialogRef.close(payload);
  }
}
