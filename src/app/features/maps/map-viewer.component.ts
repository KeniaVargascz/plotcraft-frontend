import { Component, DestroyRef, inject, input, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorldMap } from '../../core/models/world-map.model';
import { MapsService } from '../../core/services/maps.service';
import { MapCanvasComponent } from './components/map-canvas.component';
import { MapLegendComponent } from './components/map-legend.component';

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [MapCanvasComponent, MapLegendComponent],
  template: `
    @if (loading()) {
      <div class="loading"><p>Cargando mapa...</p></div>
    } @else if (mapData()) {
      <div class="viewer-shell">
        <app-map-canvas [mapData]="mapData()" [editable]="false" [activeTool]="'pan'" />
        <div class="legend-overlay">
          <app-map-legend [markers]="mapData()!.markers" [regions]="mapData()!.regions" />
        </div>
      </div>
    } @else {
      <div class="empty"><p>No hay mapa disponible.</p></div>
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 400px;
    }
    .loading,
    .empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary, #aaa);
    }
    .viewer-shell {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .legend-overlay {
      position: absolute;
      bottom: 12px;
      right: 12px;
      z-index: 5;
      max-width: 220px;
      opacity: 0.9;
    }
  `,
})
export class MapViewerComponent implements OnInit {
  readonly worldSlug = input.required<string>();

  private readonly mapsService = inject(MapsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly mapData = signal<WorldMap | null>(null);

  ngOnInit(): void {
    this.mapsService.getMap(this.worldSlug()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (map) => {
        this.mapData.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
