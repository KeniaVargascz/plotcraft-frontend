import { MapMarkerResponse } from './map-marker.model';
import { MapRegionResponse } from './map-region.model';

export interface WorldMap {
  id: string;
  baseImageUrl: string | null;
  viewport: { x: number; y: number; zoom: number };
  canvasWidth: number;
  canvasHeight: number;
  markers: MapMarkerResponse[];
  regions: MapRegionResponse[];
}
