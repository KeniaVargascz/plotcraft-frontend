import { Component, input, output } from '@angular/core';
import {
  TimelineEvent,
  TimelineEventType,
  TimelineEventRelevance,
} from '../../../core/models/timeline.model';

const TYPE_COLORS: Record<TimelineEventType, string> = {
  WORLD_EVENT: '#3db05a',
  STORY_EVENT: '#3b82f6',
  CHARACTER_ARC: '#8b5cf6',
  CHAPTER_EVENT: '#22c55e',
  LORE_EVENT: '#c9a84c',
  NOTE: '#6b7280',
};

const TYPE_ICONS: Record<TimelineEventType, string> = {
  WORLD_EVENT: '\u{1F30D}',
  STORY_EVENT: '\u{1F4D6}',
  CHARACTER_ARC: '\u{1F3AD}',
  CHAPTER_EVENT: '\u{1F4C4}',
  LORE_EVENT: '\u{1F4DC}',
  NOTE: '\u{1F4DD}',
};

const RELEVANCE_OPACITY: Record<TimelineEventRelevance, number> = {
  CRITICAL: 1,
  MAJOR: 0.85,
  MINOR: 0.65,
  BACKGROUND: 0.45,
};

@Component({
  selector: 'app-timeline-event-card',
  standalone: true,
  template: `
    <div
      class="event-card"
      [style.border-left-color]="typeColor()"
      [style.opacity]="relevanceOpacity()"
      (mouseenter)="hovered = true"
      (mouseleave)="hovered = false"
    >
      <div class="event-header">
        <span
          class="type-badge"
          [style.background]="typeColor() + '22'"
          [style.color]="typeColor()"
        >
          {{ typeIcon() }} {{ typeLabel() }}
        </span>
        <span class="relevance-badge">{{ event().relevance }}</span>
      </div>

      <h4 class="event-title">{{ event().title }}</h4>

      @if (event().dateLabel) {
        <span class="date-label">{{ event().dateLabel }}</span>
      }

      @if (event().description) {
        <p class="event-desc">{{ event().description }}</p>
      }

      <div class="ref-chips">
        @if (event().chapter) {
          <span class="ref-chip chapter">📄 {{ event().chapter!.title }}</span>
        }
        @if (event().character) {
          <span class="ref-chip character">🎭 {{ event().character!.name }}</span>
        }
        @if (event().world) {
          <span class="ref-chip world">🌍 {{ event().world!.name }}</span>
        }
        @if (event().wbEntry) {
          <span class="ref-chip wb">📜 {{ event().wbEntry!.name }}</span>
        }
      </div>

      @if (showActions() && hovered) {
        <div class="card-actions">
          <button type="button" class="act-btn" (click)="edit.emit(event())">Editar</button>
          <button type="button" class="act-btn danger" (click)="delete.emit(event())">
            Eliminar
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .event-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-left: 4px solid var(--accent);
        border-radius: 0.75rem;
        padding: 0.75rem;
        display: grid;
        gap: 0.4rem;
        position: relative;
        transition: box-shadow 0.2s;
        cursor: default;
        min-width: 180px;
        max-width: 260px;
      }
      .event-card:hover {
        box-shadow: var(--shadow);
      }
      .event-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .type-badge {
        font-size: 0.68rem;
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        white-space: nowrap;
      }
      .relevance-badge {
        font-size: 0.62rem;
        color: var(--text-3);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .event-title {
        margin: 0;
        font-size: 0.88rem;
        color: var(--text-1);
        line-height: 1.3;
      }
      .date-label {
        font-size: 0.72rem;
        color: var(--text-2);
      }
      .event-desc {
        margin: 0;
        font-size: 0.75rem;
        color: var(--text-3);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .ref-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
      }
      .ref-chip {
        font-size: 0.62rem;
        padding: 0.1rem 0.4rem;
        border-radius: 999px;
        background: var(--bg-surface);
        color: var(--text-2);
        border: 1px solid var(--border);
      }
      .card-actions {
        display: flex;
        gap: 0.4rem;
        padding-top: 0.3rem;
        border-top: 1px solid var(--border);
      }
      .act-btn {
        flex: 1;
        padding: 0.3rem 0.5rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.72rem;
        cursor: pointer;
      }
      .act-btn:hover {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .act-btn.danger:hover {
        background: var(--danger);
        color: #fff;
      }
    `,
  ],
})
export class TimelineEventCardComponent {
  readonly event = input.required<TimelineEvent>();
  readonly showActions = input(true);

  readonly edit = output<TimelineEvent>();
  readonly delete = output<TimelineEvent>();

  hovered = false;

  typeColor() {
    return TYPE_COLORS[this.event().type] || '#6b7280';
  }
  typeIcon() {
    return TYPE_ICONS[this.event().type] || '';
  }
  relevanceOpacity() {
    return RELEVANCE_OPACITY[this.event().relevance] || 1;
  }

  typeLabel(): string {
    const labels: Record<string, string> = {
      WORLD_EVENT: 'Mundo',
      STORY_EVENT: 'Historia',
      CHARACTER_ARC: 'Personaje',
      CHAPTER_EVENT: 'Capitulo',
      LORE_EVENT: 'Lore',
      NOTE: 'Nota',
    };
    return labels[this.event().type] || this.event().type;
  }
}
