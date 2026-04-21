import { Injectable, inject } from '@angular/core';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class ExportsService {
  private readonly api = inject(HttpApiService);

  exportNovelTxt(slug: string) {
    const { http, baseUrl } = this.api.raw();
    return http.get(`${baseUrl}/exports/novels/${slug}/txt`, { responseType: 'blob' });
  }

  exportNovelMd(slug: string) {
    const { http, baseUrl } = this.api.raw();
    return http.get(`${baseUrl}/exports/novels/${slug}/md`, { responseType: 'blob' });
  }

  exportNovelJson(slug: string) {
    const { http, baseUrl } = this.api.raw();
    return http.get(`${baseUrl}/exports/novels/${slug}/json`, { responseType: 'blob' });
  }

  exportChapterMd(slug: string, chSlug: string) {
    const { http, baseUrl } = this.api.raw();
    return http.get(`${baseUrl}/exports/novels/${slug}/chapters/${chSlug}/md`, {
      responseType: 'blob',
    });
  }

  exportWorldJson(slug: string) {
    const { http, baseUrl } = this.api.raw();
    return http.get(`${baseUrl}/exports/worlds/${slug}/json`, { responseType: 'blob' });
  }

  exportCharacterJson(username: string, slug: string) {
    const { http, baseUrl } = this.api.raw();
    return http.get(`${baseUrl}/exports/characters/${username}/${slug}/json`, {
      responseType: 'blob',
    });
  }
}
