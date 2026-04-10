import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  computed,
  viewChild,
  effect,
  OnDestroy,
} from '@angular/core';
import { WorldMap } from '../../../core/models/world-map.model';
import { MapMarkerResponse } from '../../../core/models/map-marker.model';
import { MapRegionResponse } from '../../../core/models/map-region.model';
import { MARKER_CONFIG } from './marker-type-icon.component';

@Component({
  selector: 'app-map-canvas',
  standalone: true,
  template: `
    <svg
      #svgEl
      class="map-svg"
      [attr.viewBox]="viewBox()"
      (mousedown)="onMouseDown($event)"
      (mousemove)="onMouseMove($event)"
      (mouseup)="onMouseUp($event)"
      (mouseleave)="onMouseUp($event)"
      (wheel)="onWheel($event)"
      (click)="onClick($event)"
      (dblclick)="onDblClick($event)"
    >
      <!-- Background image -->
      @if (mapData()?.baseImageUrl) {
        <image
          [attr.href]="mapData()!.baseImageUrl"
          [attr.width]="mapData()!.canvasWidth"
          [attr.height]="mapData()!.canvasHeight"
          x="0"
          y="0"
          preserveAspectRatio="xMidYMid meet"
        />
      } @else {
        <rect
          x="0"
          y="0"
          [attr.width]="mapData()?.canvasWidth ?? 1920"
          [attr.height]="mapData()?.canvasHeight ?? 1080"
          fill="var(--surface-ground, #121220)"
        />
      }

      <!-- Regions -->
      @for (region of regions(); track region.id) {
        <polygon
          [attr.points]="regionPoints(region)"
          [attr.fill]="region.color"
          [attr.stroke]="region.borderColor"
          stroke-width="2"
          class="region-polygon"
          [class.selected]="selectedRegionId() === region.id"
        />
        @if (region.label) {
          <text
            [attr.x]="regionCentroid(region).x"
            [attr.y]="regionCentroid(region).y"
            text-anchor="middle"
            dominant-baseline="central"
            class="region-label"
            [attr.fill]="region.borderColor"
          >
            {{ region.label }}
          </text>
        }
      }

      <!-- Region drawing preview -->
      @if (activeTool() === 'region' && drawingPoints().length > 0) {
        <polyline
          [attr.points]="drawingPointsStr()"
          fill="none"
          stroke="var(--accent, #8b5cf6)"
          stroke-width="2"
          stroke-dasharray="6 3"
        />
        @for (pt of drawingPoints(); track $index) {
          <circle
            [attr.cx]="pt.x"
            [attr.cy]="pt.y"
            r="4"
            fill="var(--accent, #8b5cf6)"
            [class.first-point]="$index === 0"
          />
        }
      }

      <!-- Markers -->
      @for (marker of markers(); track marker.id) {
        <g
          class="marker-group"
          [class.selected]="selectedMarkerId() === marker.id"
          [attr.transform]="'translate(' + marker.x + ',' + marker.y + ')'"
          (mousedown)="onMarkerMouseDown($event, marker)"
        >
          <circle
            r="14"
            [attr.fill]="marker.color || markerColor(marker.type)"
            opacity="0.85"
            class="marker-bg"
          />
          <text
            text-anchor="middle"
            dominant-baseline="central"
            font-size="14"
            class="marker-emoji"
          >
            {{ markerEmoji(marker) }}
          </text>
          <text
            y="22"
            text-anchor="middle"
            font-size="10"
            fill="var(--text-primary, #eee)"
            class="marker-label"
          >
            {{ marker.label }}
          </text>
        </g>
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .map-svg {
      width: 100%;
      height: 100%;
      cursor: grab;
      user-select: none;
      background: var(--surface-ground, #0c0c16);
    }
    .map-svg:active {
      cursor: grabbing;
    }
    .region-polygon {
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.15s;
    }
    .region-polygon:hover {
      opacity: 0.9;
    }
    .region-polygon.selected {
      stroke-width: 3;
      opacity: 1;
    }
    .region-label {
      font-size: 12px;
      font-weight: 600;
      pointer-events: none;
    }
    .marker-group {
      cursor: pointer;
    }
    .marker-group:hover .marker-bg {
      opacity: 1;
      r: 16;
    }
    .marker-group.selected .marker-bg {
      stroke: #fff;
      stroke-width: 2;
    }
    .marker-emoji {
      pointer-events: none;
    }
    .marker-label {
      pointer-events: none;
      fill: var(--text-primary, #eee);
    }
    .first-point {
      stroke: #fff;
      stroke-width: 2;
      cursor: pointer;
    }
  `,
})
export class MapCanvasComponent implements OnDestroy {
  readonly mapData = input<WorldMap | null>(null);
  readonly editable = input(false);
  readonly activeTool = input('pan');

  readonly markerCreated = output<{ x: number; y: number }>();
  readonly markerUpdated = output<{ id: string; x: number; y: number }>();
  readonly markerDeleted = output<string>();
  readonly regionCreated = output<{ points: { x: number; y: number }[] }>();
  readonly viewportChanged = output<{ x: number; y: number; zoom: number }>();
  readonly markerSelected = output<MapMarkerResponse | null>();

  readonly svgEl = viewChild.required<ElementRef<SVGSVGElement>>('svgEl');

  // Pan/zoom state
  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly zoom = signal(1);

  // Interaction state
  readonly isPanning = signal(false);
  readonly isDraggingMarker = signal(false);
  readonly selectedMarkerId = signal<string | null>(null);
  readonly selectedRegionId = signal<string | null>(null);
  readonly drawingPoints = signal<{ x: number; y: number }[]>([]);

  private lastMouse = { x: 0, y: 0 };
  private dragMarker: MapMarkerResponse | null = null;
  private viewportTimer: ReturnType<typeof setTimeout> | null = null;

  readonly markers = computed(() => this.mapData()?.markers ?? []);
  readonly regions = computed(() => this.mapData()?.regions ?? []);

  readonly viewBox = computed(() => {
    const w = this.mapData()?.canvasWidth ?? 1920;
    const h = this.mapData()?.canvasHeight ?? 1080;
    const z = this.zoom();
    const vw = w / z;
    const vh = h / z;
    const vx = this.panX() - vw / 2;
    const vy = this.panY() - vh / 2;
    return `${vx} ${vy} ${vw} ${vh}`;
  });

  readonly drawingPointsStr = computed(() =>
    this.drawingPoints()
      .map((p) => `${p.x},${p.y}`)
      .join(' '),
  );

  constructor() {
    effect(() => {
      const map = this.mapData();
      if (map?.viewport) {
        this.panX.set(map.viewport.x);
        this.panY.set(map.viewport.y);
        this.zoom.set(map.viewport.zoom);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.viewportTimer) clearTimeout(this.viewportTimer);
  }

  // ─── SVG coordinate helpers ───

  private svgPoint(event: MouseEvent): { x: number; y: number } {
    const svg = this.svgEl().nativeElement;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (ctm) {
      const transformed = pt.matrixTransform(ctm);
      return { x: Math.round(transformed.x), y: Math.round(transformed.y) };
    }
    return { x: 0, y: 0 };
  }

  // ─── Mouse handlers ───

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    this.lastMouse = { x: event.clientX, y: event.clientY };

    if (this.activeTool() === 'pan') {
      this.isPanning.set(true);
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isPanning()) {
      const dx = event.clientX - this.lastMouse.x;
      const dy = event.clientY - this.lastMouse.y;
      const z = this.zoom();
      this.panX.update((v) => v - dx / z);
      this.panY.update((v) => v - dy / z);
      this.lastMouse = { x: event.clientX, y: event.clientY };
      this.scheduleViewportEmit();
    }

    if (this.isDraggingMarker() && this.dragMarker && this.editable()) {
      const pt = this.svgPoint(event);
      this.markerUpdated.emit({ id: this.dragMarker.id, x: pt.x, y: pt.y });
    }
  }

  onMouseUp(_event?: MouseEvent): void {
    if (this.isDraggingMarker() && this.dragMarker) {
      this.isDraggingMarker.set(false);
      this.dragMarker = null;
    }
    this.isPanning.set(false);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    this.zoom.update((z) => Math.max(0.1, Math.min(10, z * factor)));
    this.scheduleViewportEmit();
  }

  onClick(event: MouseEvent): void {
    if (!this.editable()) return;
    const tool = this.activeTool();
    const pt = this.svgPoint(event);

    if (tool === 'marker') {
      this.markerCreated.emit(pt);
    }

    if (tool === 'region') {
      const pts = this.drawingPoints();
      // Check if clicking near first point to close polygon
      if (pts.length >= 3) {
        const first = pts[0];
        const dist = Math.hypot(pt.x - first.x, pt.y - first.y);
        const closeThreshold = 20 / this.zoom();
        if (dist < closeThreshold) {
          this.regionCreated.emit({ points: [...pts] });
          this.drawingPoints.set([]);
          return;
        }
      }
      this.drawingPoints.update((arr) => [...arr, pt]);
    }

    if (tool === 'select') {
      // Deselect when clicking empty space
      this.selectedMarkerId.set(null);
      this.markerSelected.emit(null);
    }
  }

  onDblClick(_event?: MouseEvent): void {
    // Double-click to close region drawing
    if (this.activeTool() === 'region' && this.drawingPoints().length >= 3) {
      this.regionCreated.emit({ points: [...this.drawingPoints()] });
      this.drawingPoints.set([]);
    }
  }

  onMarkerMouseDown(event: MouseEvent, marker: MapMarkerResponse): void {
    event.stopPropagation();
    if (!this.editable()) return;

    if (this.activeTool() === 'select') {
      this.selectedMarkerId.set(marker.id);
      this.markerSelected.emit(marker);
      this.dragMarker = marker;
      this.isDraggingMarker.set(true);
    }
  }

  // ─── Actions ───

  zoomIn(): void {
    this.zoom.update((z) => Math.min(10, z * 1.25));
    this.scheduleViewportEmit();
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(0.1, z * 0.8));
    this.scheduleViewportEmit();
  }

  resetView(): void {
    const w = this.mapData()?.canvasWidth ?? 1920;
    const h = this.mapData()?.canvasHeight ?? 1080;
    this.panX.set(w / 2);
    this.panY.set(h / 2);
    this.zoom.set(1);
    this.scheduleViewportEmit();
  }

  clearDrawing(): void {
    this.drawingPoints.set([]);
  }

  // ─── Helpers ───

  regionPoints(region: MapRegionResponse): string {
    return region.points.map((p) => `${p.x},${p.y}`).join(' ');
  }

  regionCentroid(region: MapRegionResponse): { x: number; y: number } {
    const pts = region.points;
    if (pts.length === 0) return { x: 0, y: 0 };
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { x: cx, y: cy };
  }

  markerEmoji(marker: MapMarkerResponse): string {
    if (marker.icon) return marker.icon;
    return MARKER_CONFIG[marker.type]?.emoji ?? '\u{1F4CD}';
  }

  markerColor(type: string): string {
    return (MARKER_CONFIG as Record<string, { color: string }>)[type]?.color ?? '#888';
  }

  private scheduleViewportEmit(): void {
    if (this.viewportTimer) clearTimeout(this.viewportTimer);
    this.viewportTimer = setTimeout(() => {
      this.viewportChanged.emit({
        x: this.panX(),
        y: this.panY(),
        zoom: this.zoom(),
      });
    }, 1000);
  }
}
