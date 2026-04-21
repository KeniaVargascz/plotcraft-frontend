import { Injectable, inject } from '@angular/core';
import { MapMarkerResponse } from '../models/map-marker.model';
import { MapRegionResponse } from '../models/map-region.model';
import { WorldMap } from '../models/world-map.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class MapsService {
  private readonly api = inject(HttpApiService);

  getMap(worldSlug: string) {
    return this.api.get<WorldMap>(`/worlds/${worldSlug}/map`);
  }

  updateMap(worldSlug: string, payload: Partial<WorldMap>) {
    return this.api.patch<WorldMap>(`/worlds/${worldSlug}/map`, payload);
  }

  updateViewport(worldSlug: string, viewport: { x: number; y: number; zoom: number }) {
    return this.api.patch<WorldMap>(`/worlds/${worldSlug}/map/viewport`, viewport);
  }

  createMarker(worldSlug: string, payload: Partial<MapMarkerResponse>) {
    return this.api.post<MapMarkerResponse>(`/worlds/${worldSlug}/map/markers`, payload);
  }

  updateMarker(worldSlug: string, markerId: string, payload: Partial<MapMarkerResponse>) {
    return this.api.patch<MapMarkerResponse>(
      `/worlds/${worldSlug}/map/markers/${markerId}`,
      payload,
    );
  }

  deleteMarker(worldSlug: string, markerId: string) {
    return this.api.delete<{ message: string }>(`/worlds/${worldSlug}/map/markers/${markerId}`);
  }

  createRegion(worldSlug: string, payload: Partial<MapRegionResponse>) {
    return this.api.post<MapRegionResponse>(`/worlds/${worldSlug}/map/regions`, payload);
  }

  updateRegion(worldSlug: string, regionId: string, payload: Partial<MapRegionResponse>) {
    return this.api.patch<MapRegionResponse>(
      `/worlds/${worldSlug}/map/regions/${regionId}`,
      payload,
    );
  }

  deleteRegion(worldSlug: string, regionId: string) {
    return this.api.delete<{ message: string }>(`/worlds/${worldSlug}/map/regions/${regionId}`);
  }
}
