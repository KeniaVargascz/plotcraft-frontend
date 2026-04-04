import { Component, input, computed, signal } from '@angular/core';
import { ChapterStats } from '../../../core/models/novel-analytics.model';

@Component({
  selector: 'app-chapter-funnel',
  standalone: true,
  template: `
    <div class="funnel-container">
      <svg
        [attr.viewBox]="viewBox()"
        class="funnel-svg"
        preserveAspectRatio="none"
        (mouseleave)="hoveredIndex.set(-1)"
      >
        @for (bar of bars(); track bar.index) {
          <rect
            [attr.x]="bar.x"
            [attr.y]="bar.y"
            [attr.width]="bar.width"
            [attr.height]="bar.height"
            [attr.fill]="bar.color"
            [attr.opacity]="hoveredIndex() === bar.index ? 1 : 0.85"
            rx="2"
            (mouseenter)="hoveredIndex.set(bar.index)"
          />
        }

        @if (retentionPoints().length > 1) {
          <polyline
            [attr.points]="retentionPoints()"
            fill="none"
            stroke="var(--accent)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
            opacity="0.9"
          />
        }
      </svg>

      @if (hoveredIndex() >= 0 && hoveredChapter()) {
        <div class="tooltip">
          <strong>{{ hoveredChapter()!.title }}</strong>
          <span>Lecturas: {{ hoveredChapter()!.stats.uniqueReads }}</span>
          <span>Completado: {{ hoveredChapter()!.stats.completionRate }}%</span>
        </div>
      }
    </div>
  `,
  styles: `
    .funnel-container {
      position: relative;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }
    .funnel-svg {
      width: 100%;
      height: 200px;
    }
    .tooltip {
      position: absolute;
      top: 8px;
      right: 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.8rem;
      color: var(--text-2);
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .tooltip strong {
      color: var(--text-1);
      font-size: 0.85rem;
    }
  `,
})
export class ChapterFunnelComponent {
  readonly chapters = input.required<ChapterStats[]>();
  readonly hoveredIndex = signal(-1);

  protected readonly hoveredChapter = computed(() => {
    const idx = this.hoveredIndex();
    if (idx < 0) return null;
    return this.chapters()[idx] ?? null;
  });

  protected readonly viewBox = computed(() => {
    const count = this.chapters().length || 1;
    const width = count * 40;
    return `0 0 ${width} 200`;
  });

  protected readonly bars = computed(() => {
    const chs = this.chapters();
    if (!chs.length) return [];
    const maxReads = Math.max(...chs.map((c) => c.stats.uniqueReads), 1);
    const barWidth = 28;
    const gap = 12;
    const maxHeight = 180;

    return chs.map((ch, i) => {
      const height = (ch.stats.uniqueReads / maxReads) * maxHeight;
      const t = chs.length <= 1 ? 0 : i / (chs.length - 1);
      const r = Math.round(34 + t * (239 - 34));
      const g = Math.round(197 - t * (197 - 68));
      const b = Math.round(94 - t * (94 - 68));
      return {
        index: i,
        x: i * (barWidth + gap),
        y: 190 - height,
        width: barWidth,
        height,
        color: `rgb(${r}, ${g}, ${b})`,
      };
    });
  });

  protected readonly retentionPoints = computed(() => {
    const chs = this.chapters();
    if (chs.length < 2) return '';
    const barWidth = 28;
    const gap = 12;
    return chs
      .map((ch, i) => {
        const x = i * (barWidth + gap) + barWidth / 2;
        const y = 190 - (ch.stats.completionRate / 100) * 180;
        return `${x},${y}`;
      })
      .join(' ');
  });
}
