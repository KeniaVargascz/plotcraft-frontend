import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ThemeService } from '../../core/services/theme.service';
import { FeatureFlagService } from '../../core/services/feature-flag.service';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { InfoBannerComponent } from '../../shared/components/info-banner/info-banner.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    TranslatePipe,
    SearchBarComponent,
    InfoBannerComponent,
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {
  readonly themeService = inject(ThemeService);
  private readonly ff = inject(FeatureFlagService);
  readonly canRegister = this.ff.enabled('platform.registration');
}
