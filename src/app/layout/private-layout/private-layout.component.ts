import { AsyncPipe, DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { FeatureFlagService } from '../../core/services/feature-flag.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationsPanelComponent } from '../../features/notifications/notifications-panel.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { InfoBannerComponent } from '../../shared/components/info-banner/info-banner.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { FeatureFlag, FeatureFlagKey } from '../../core/constants/feature-flags.constants';

type NavItem = {
  route: string;
  label: string;
  exact?: boolean;
  excludePrefixes?: string[];
  featureKey?: FeatureFlagKey;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [
    AsyncPipe,
    CdkTrapFocus,
    MatButtonModule,
    MatIconModule,
    NgTemplateOutlet,
    NotificationsPanelComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SearchBarComponent,
    InfoBannerComponent,
    TranslatePipe,
  ],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateLayoutComponent {
  readonly authService = inject(AuthService);
  readonly ff = inject(FeatureFlagService);
  readonly themeService = inject(ThemeService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  @ViewChild('mobileMenuButton') private mobileMenuButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('mobileDrawerCloseButton')
  private mobileDrawerCloseButton?: ElementRef<HTMLButtonElement>;

  readonly isMobile = signal(false);
  readonly isMobileMenuOpen = signal(false);
  readonly isMobileSearchOpen = signal(false);
  readonly showNotifications = signal(false);
  readonly unreadCount = signal(0);

  readonly primaryNavItems: NavItem[] = [
    { route: '/feed', label: 'Feed', exact: true, featureKey: FeatureFlag.SOCIAL_FEED },
    { route: '/descubrir', label: 'Descubrir', featureKey: FeatureFlag.EXPLORE_DISCOVERY },
    { route: '/novelas', label: 'Novelas', featureKey: FeatureFlag.EXPLORE_NOVELS_CATALOG },
    { route: '/mundos', label: 'Mundos', featureKey: FeatureFlag.EXPLORE_WORLDS_CATALOG },
    { route: '/mi-perfil', label: 'Perfil' },
  ];

  readonly navGroups: NavGroup[] = [
    {
      label: 'Explorar',
      items: [
        { route: '/feed', label: 'Feed', exact: true, featureKey: FeatureFlag.SOCIAL_FEED },
        { route: '/descubrir', label: 'Descubrir', featureKey: FeatureFlag.EXPLORE_DISCOVERY },
        {
          route: '/novelas',
          label: 'Novelas',
          excludePrefixes: ['/novelas/generos'],
          featureKey: FeatureFlag.EXPLORE_NOVELS_CATALOG,
        },
        { route: '/mundos', label: 'Mundos', featureKey: FeatureFlag.EXPLORE_WORLDS_CATALOG },
        { route: '/personajes', label: 'Personajes', featureKey: FeatureFlag.EXPLORE_CHARACTERS_CATALOG },
        { route: '/foro', label: 'Foro', featureKey: FeatureFlag.COMMUNITY_FORUM },
        { route: '/comunidades', label: 'Comunidades', exact: true, featureKey: FeatureFlag.COMMUNITY_COMMUNITIES },
        { route: '/novelas/generos', label: 'Categorías' },
      ],
    },
    {
      label: 'Comunidad',
      items: [
        { route: '/mis-comunidades', label: 'Mis comunidades', featureKey: FeatureFlag.COMMUNITY_COMMUNITIES },
      ],
    },
    {
      label: 'Autor',
      items: [
        { route: '/mis-novelas', label: 'Mis novelas', featureKey: FeatureFlag.AUTHOR_NOVELS },
        { route: '/mis-mundos', label: 'Mis mundos', featureKey: FeatureFlag.AUTHOR_WORLDS },
        { route: '/mis-personajes', label: 'Mis personajes', featureKey: FeatureFlag.AUTHOR_CHARACTERS },
        { route: '/referencias-visuales', label: 'Tableros', featureKey: FeatureFlag.AUTHOR_VISUAL_BOARDS },
        { route: '/mis-timelines', label: 'Timelines', featureKey: FeatureFlag.AUTHOR_TIMELINES },
        { route: '/planner', label: 'Planner', featureKey: FeatureFlag.AUTHOR_PLANNER },
      ],
    },
    {
      label: 'Biblioteca',
      items: [
        { route: '/biblioteca', label: 'Biblioteca', exact: true, featureKey: FeatureFlag.READER_LIBRARY },
        { route: '/biblioteca/colecciones', label: 'Colecciones', featureKey: FeatureFlag.READER_LIBRARY },
        { route: '/mis-suscripciones', label: 'Suscripciones', featureKey: FeatureFlag.READER_SUBSCRIPTIONS },
      ],
    },
    {
      label: 'Herramientas',
      items: [
        { route: '/analytics', label: 'Analytics', featureKey: FeatureFlag.AUTHOR_ANALYTICS },
        { route: '/herramientas/plantillas', label: 'Plantillas', featureKey: FeatureFlag.PLATFORM_TEMPLATES },
      ],
    },
    {
      label: 'Personal',
      items: [
        { route: '/mi-perfil', label: 'Mi perfil' },
        { route: '/cuenta', label: 'Configuracion' },
      ],
    },
  ];

  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastMenuTrigger: HTMLElement | null = null;

  constructor() {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.isMobile.set(result.matches);
        if (!result.matches) {
          this.closeMobileMenu(false);
          this.isMobileSearchOpen.set(false);
        }
      });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeMobileMenu(false);
        this.isMobileSearchOpen.set(false);
        this.showNotifications.set(false);
      });

    effect(() => {
      this.document.body.style.overflow =
        this.isMobile() && this.isMobileMenuOpen() ? 'hidden' : '';
    });

    this.loadUnreadCount();
    this.pollInterval = setInterval(() => this.loadUnreadCount(), 60_000);
    this.destroyRef.onDestroy(() => {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }
      this.document.body.style.overflow = '';
    });
  }

  openMobileMenu(trigger?: EventTarget | null): void {
    this.lastMenuTrigger =
      trigger instanceof HTMLElement ? trigger : (this.mobileMenuButton?.nativeElement ?? null);
    this.isMobileSearchOpen.set(false);
    this.isMobileMenuOpen.set(true);
    setTimeout(() => this.mobileDrawerCloseButton?.nativeElement.focus());
  }

  closeMobileMenu(restoreFocus = true): void {
    if (!this.isMobileMenuOpen()) {
      return;
    }
    this.isMobileMenuOpen.set(false);
    if (restoreFocus) {
      setTimeout(() => this.lastMenuTrigger?.focus());
    }
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen.update((value) => !value);
    if (this.isMobileSearchOpen()) {
      this.closeMobileMenu(false);
    }
  }

  toggleNotifications(): void {
    this.showNotifications.update((value) => !value);
    if (this.showNotifications()) {
      this.closeMobileMenu(false);
    }
  }

  closeNotifications(): void {
    this.showNotifications.set(false);
  }

  logout(): void {
    this.authService.logout();
  }

  isNavItemVisible(item: NavItem): boolean {
    if (!item.featureKey) return true;
    return this.ff.enabled(item.featureKey)();
  }

  isActive(route: string, exact = false): boolean {
    const currentUrl = this.router.url;
    if (exact) {
      return currentUrl === route;
    }
    return currentUrl === route || currentUrl.startsWith(`${route}/`);
  }

  isNavItemActive(item: NavItem): boolean {
    const currentUrl = this.router.url;
    if (
      item.excludePrefixes?.some(
        (prefix) => currentUrl === prefix || currentUrl.startsWith(`${prefix}/`),
      )
    ) {
      return false;
    }

    return this.isActive(item.route, item.exact ?? false);
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
      return;
    }
    if (this.showNotifications()) {
      this.showNotifications.set(false);
      this.mobileMenuButton?.nativeElement.focus();
    }
  }

  private loadUnreadCount(): void {
    this.notificationsService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.count),
    });
  }
}
