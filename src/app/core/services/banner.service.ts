import { Injectable, inject, signal } from '@angular/core';
import { timeout, catchError, of } from 'rxjs';
import { HttpApiService } from './http-api.service';

interface BannerData {
  enabled: boolean;
  html: string;
}

@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly api = inject(HttpApiService);

  readonly banner = signal<BannerData>({ enabled: false, html: '' });
  readonly dismissed = signal(false);

  load(): void {
    this.api
      .get<BannerData>('/features/banner')
      .pipe(
        timeout(5000),
        catchError(() => of({ enabled: false, html: '' })),
      )
      .subscribe((data) => this.banner.set(data));
  }

  dismiss(): void {
    this.dismissed.set(true);
    sessionStorage.setItem('banner_dismissed', '1');
  }

  isDismissed(): boolean {
    return this.dismissed() || sessionStorage.getItem('banner_dismissed') === '1';
  }
}
