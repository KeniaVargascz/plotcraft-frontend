import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

type HttpOptions = {
  params?: HttpParams | Record<string, string | number | boolean | string[]>;
  headers?: Record<string, string>;
};

/**
 * Thin wrapper over HttpClient that:
 * 1. Prepends the API base URL automatically
 * 2. Unwraps ApiResponse<T> → T for standard endpoints
 * 3. Provides raw() for non-standard responses (blobs, non-ApiResponse)
 */
@Injectable({ providedIn: 'root' })
export class HttpApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, options?: HttpOptions): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, options)
      .pipe(map((r) => r.data));
  }

  post<T>(path: string, body: unknown = {}, options?: HttpOptions): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, options)
      .pipe(map((r) => r.data));
  }

  put<T>(path: string, body: unknown = {}, options?: HttpOptions): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, options)
      .pipe(map((r) => r.data));
  }

  patch<T>(path: string, body: unknown = {}, options?: HttpOptions): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body, options)
      .pipe(map((r) => r.data));
  }

  delete<T>(path: string, options?: HttpOptions): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`, options)
      .pipe(map((r) => r.data));
  }

  /** For non-standard responses (blobs, raw HTTP, non-ApiResponse endpoints) */
  raw() {
    return { http: this.http, baseUrl: this.baseUrl };
  }
}
