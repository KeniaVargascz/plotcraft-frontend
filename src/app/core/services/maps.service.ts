import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { MapMarkerResponse } from '../models/map-marker.model';
import { MapRegionResponse } from '../models/map-region.model';
import { WorldMap } from '../models/world-map.model';

@Injectable({ providedIn: 'root' })
export class MapsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/worlds`;

  getMap(worldSlug: string) {
    return this.http
      .get<ApiResponse<WorldMap>>(`${this.base}/${worldSlug}/map`)
      .pipe(map((r) => r.data));
  }

  updateMap(worldSlug: string, payload: Partial<WorldMap>) {
    return this.http
      .patch<ApiResponse<WorldMap>>(`${this.base}/${worldSlug}/map`, payload)
      .pipe(map((r) => r.data));
  }

  updateViewport(worldSlug: string, viewport: { x: number; y: number; zoom: number }) {
    return this.http
      .patch<ApiResponse<WorldMap>>(`${this.base}/${worldSlug}/map/viewport`, viewport)
      .pipe(map((r) => r.data));
  }

  createMarker(worldSlug: string, payload: Partial<MapMarkerResponse>) {
    return this.http
      .post<ApiResponse<MapMarkerResponse>>(`${this.base}/${worldSlug}/map/markers`, payload)
      .pipe(map((r) => r.data));
  }

  updateMarker(worldSlug: string, markerId: string, payload: Partial<MapMarkerResponse>) {
    return this.http
      .patch<ApiResponse<MapMarkerResponse>>(
        `${this.base}/${worldSlug}/map/markers/${markerId}`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  deleteMarker(worldSlug: string, markerId: string) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(
        `${this.base}/${worldSlug}/map/markers/${markerId}`,
      )
      .pipe(map((r) => r.data));
  }

  createRegion(worldSlug: string, payload: Partial<MapRegionResponse>) {
    return this.http
      .post<ApiResponse<MapRegionResponse>>(`${this.base}/${worldSlug}/map/regions`, payload)
      .pipe(map((r) => r.data));
  }

  updateRegion(worldSlug: string, regionId: string, payload: Partial<MapRegionResponse>) {
    return this.http
      .patch<ApiResponse<MapRegionResponse>>(
        `${this.base}/${worldSlug}/map/regions/${regionId}`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  deleteRegion(worldSlug: string, regionId: string) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(
        `${this.base}/${worldSlug}/map/regions/${regionId}`,
      )
      .pipe(map((r) => r.data));
  }
}
