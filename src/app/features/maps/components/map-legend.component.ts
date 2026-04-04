import { Component, input, computed } from '@angular/core';
import { MapMarkerResponse, MarkerType } from '../../../core/models/map-marker.model';
import { MapRegionResponse } from '../../../core/models/map-region.model';
import { MarkerTypeIconComponent, MARKER_CONFIG } from './marker-type-icon.component';

@Component({
  selector: 'app-map-legend',
  standalone: true,
  imports: [MarkerTypeIconComponent],
  template: `
    <div class="legend">
      @if (markerTypeEntries().length > 0) {
        <div class="legend-section">
          <span class="legend-title">Marcadores</span>
          @for (entry of markerTypeEntries(); track entry.type) {
            <div class="legend-item">
              <app-marker-type-icon [type]="entry.type" />
              <span class="legend-label">{{ entry.type }} ({{ entry.count }})</span>
            </div>
          }
        </div>
      }

      @if (regions().length > 0) {
        <div class="legend-section">
          <span class="legend-title">Regiones</span>
          @for (region of regions(); track region.id) {
            <div class="legend-item">
              <span class="color-dot" [style.background]="region.borderColor"></span>
              <span class="legend-label">{{ region.label }}</span>
            </div>
          }
        </div>
      }

      @if (markerTypeEntries().length === 0 && regions().length === 0) {
        <p class="empty">Sin elementos en el mapa.</p>
      }
    </div>
  `,
  styles: `
    .legend {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      background: var(--surface-card, #1e1e2e);
      border-radius: 8px;
      border: 1px solid var(--border-color, #2a2a3a);
      font-size: 0.82rem;
    }
    .legend-title {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary, #aaa);
      margin-bottom: 4px;
    }
    .legend-section { display: flex; flex-direction: column; gap: 4px; }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-label { color: var(--text-primary, #ddd); }
    .color-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .empty { color: var(--text-secondary, #888); font-size: 0.8rem; margin: 0; }
  `,
})
export class MapLegendComponent {
  readonly markers = input<MapMarkerResponse[]>([]);
  readonly regions = input<MapRegionResponse[]>([]);

  readonly markerTypeEntries = computed(() => {
    const counts = new Map<MarkerType, number>();
    for (const m of this.markers()) {
      counts.set(m.type, (counts.get(m.type) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  });
}
