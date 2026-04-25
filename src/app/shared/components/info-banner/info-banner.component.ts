import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BannerService } from '../../../core/services/banner.service';

@Component({
  selector: 'app-info-banner',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="info-banner" role="status">
        <div class="info-banner__content" [innerHTML]="bannerHtml()"></div>
        <button
          class="info-banner__close"
          type="button"
          aria-label="Cerrar banner"
          (click)="dismiss()"
        >&times;</button>
      </div>
    }
  `,
  styles: [`
    .info-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1.25rem;
      background: var(--accent, #c9a84c);
      color: var(--accent-contrast, #1a1a2e);
      font-size: 0.88rem;
      line-height: 1.4;
      z-index: 100;
    }
    .info-banner__content {
      flex: 1;
    }
    .info-banner__content ::ng-deep a {
      color: inherit;
      text-decoration: underline;
    }
    .info-banner__close {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0 0.25rem;
      opacity: 0.7;
      line-height: 1;
    }
    .info-banner__close:hover { opacity: 1; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoBannerComponent {
  private readonly bannerService = inject(BannerService);

  readonly bannerHtml = computed(() => this.bannerService.banner().html);
  readonly visible = computed(
    () => this.bannerService.banner().enabled && !this.bannerService.isDismissed(),
  );

  constructor() {
    this.bannerService.load();
  }

  dismiss(): void {
    this.bannerService.dismiss();
  }
}
