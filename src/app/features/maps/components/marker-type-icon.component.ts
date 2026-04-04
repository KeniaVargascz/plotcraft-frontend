import { Component, input, computed } from '@angular/core';
import { MarkerType } from '../../../core/models/map-marker.model';

const MARKER_CONFIG: Record<MarkerType, { emoji: string; color: string }> = {
  CITY: { emoji: '\u{1F3D9}\uFE0F', color: '#c9a84c' },
  TOWN: { emoji: '\u{1F3D8}\uFE0F', color: '#8b5cf6' },
  VILLAGE: { emoji: '\u{1F3E1}', color: '#3db05a' },
  DUNGEON: { emoji: '\u2694\uFE0F', color: '#e05555' },
  LANDMARK: { emoji: '\u{1F5FF}', color: '#9088a0' },
  RUINS: { emoji: '\u{1F3DA}\uFE0F', color: '#584030' },
  TEMPLE: { emoji: '\u{1F54C}', color: '#e09040' },
  FORTRESS: { emoji: '\u{1F3F0}', color: '#607090' },
  PORT: { emoji: '\u2693', color: '#3080c0' },
  MOUNTAIN: { emoji: '\u26F0\uFE0F', color: '#706050' },
  FOREST: { emoji: '\u{1F332}', color: '#206830' },
  CUSTOM: { emoji: '\u{1F4CD}', color: 'var(--accent, #888)' },
};

export { MARKER_CONFIG };

@Component({
  selector: 'app-marker-type-icon',
  standalone: true,
  template: `
    <span class="marker-icon" [style.color]="config().color">
      {{ config().emoji }}
    </span>
  `,
  styles: `
    :host { display: inline-flex; align-items: center; }
    .marker-icon { font-size: 1.2em; line-height: 1; }
  `,
})
export class MarkerTypeIconComponent {
  readonly type = input.required<MarkerType>();

  readonly config = computed(() => MARKER_CONFIG[this.type()] ?? MARKER_CONFIG['CUSTOM']);
}
