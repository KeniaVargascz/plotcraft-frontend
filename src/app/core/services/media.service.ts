import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

type UploadResponse =
  | { url?: string; fileUrl?: string; location?: string; path?: string }
  | string;

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

  upload(file: File, purpose = 'visual_ref') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    return this.http
      .post<ApiResponse<UploadResponse>>(`${environment.apiUrl}/media/upload`, formData)
      .pipe(
        map((response) => {
          const payload = response.data;
          if (typeof payload === 'string') {
            return payload;
          }

          const url = payload.url ?? payload.fileUrl ?? payload.location ?? payload.path;
          if (!url) {
            throw new Error('La subida no devolvio una URL valida.');
          }

          return url;
        }),
      );
  }
}
