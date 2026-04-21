import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { HttpApiService } from './http-api.service';

type UploadResponse = { url?: string; fileUrl?: string; location?: string; path?: string } | string;

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly api = inject(HttpApiService);

  upload(file: File, purpose = 'visual_ref') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    return this.api
      .post<UploadResponse>('/media/upload', formData)
      .pipe(
        map((payload) => {
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
