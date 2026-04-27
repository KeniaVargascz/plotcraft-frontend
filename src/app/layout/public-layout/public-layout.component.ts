import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ThemeService } from '../../core/services/theme.service';
import { FeatureFlagService } from '../../core/services/feature-flag.service';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { InfoBannerComponent } from '../../shared/components/info-banner/info-banner.component';
import { FeatureFlag, type FeatureFlagKey } from '../../core/constants/feature-flags.constants';

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
  readonly canRegister = this.ff.enabled(FeatureFlag.PLATFORM_REGISTRATION);

  readonly navItems = [
    { route: '/novelas', label: 'nav.novels', featureKey: FeatureFlag.EXPLORE_NOVELS_CATALOG },
    { route: '/mundos', label: 'nav.worlds', featureKey: FeatureFlag.EXPLORE_WORLDS_CATALOG },
    { route: '/personajes', label: 'nav.characters', featureKey: FeatureFlag.EXPLORE_CHARACTERS_CATALOG },
    { route: '/descubrir', label: 'nav.discovery', featureKey: FeatureFlag.EXPLORE_DISCOVERY },
  ];

  isVisible(featureKey: FeatureFlagKey): boolean {
    return this.ff.enabled(featureKey)();
  }
}
