import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExportsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/exports`;

  exportNovelTxt(slug: string) {
    return this.http.get(`${this.base}/novels/${slug}/txt`, { responseType: 'blob' });
  }

  exportNovelMd(slug: string) {
    return this.http.get(`${this.base}/novels/${slug}/md`, { responseType: 'blob' });
  }

  exportNovelJson(slug: string) {
    return this.http.get(`${this.base}/novels/${slug}/json`, { responseType: 'blob' });
  }

  exportChapterMd(slug: string, chSlug: string) {
    return this.http.get(`${this.base}/novels/${slug}/chapters/${chSlug}/md`, {
      responseType: 'blob',
    });
  }

  exportWorldJson(slug: string) {
    return this.http.get(`${this.base}/worlds/${slug}/json`, { responseType: 'blob' });
  }

  exportCharacterJson(username: string, slug: string) {
    return this.http.get(`${this.base}/characters/${username}/${slug}/json`, {
      responseType: 'blob',
    });
  }
}
