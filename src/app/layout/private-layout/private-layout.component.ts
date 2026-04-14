import { AsyncPipe, DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
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
import { NotificationsService } from '../../core/services/notifications.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationsPanelComponent } from '../../features/notifications/notifications-panel.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type NavItem = {
  route: string;
  label: string;
  exact?: boolean;
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
    TranslatePipe,
  ],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss',
})
export class PrivateLayoutComponent {
  readonly authService = inject(AuthService);
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
    { route: '/feed', label: 'Feed', exact: true },
    { route: '/descubrir', label: 'Descubrir' },
    { route: '/novelas', label: 'Novelas' },
    { route: '/mundos', label: 'Mundos' },
    { route: '/mi-perfil', label: 'Perfil' },
  ];

  readonly navGroups: NavGroup[] = [
    {
      label: 'Explorar',
      items: [
        { route: '/feed', label: 'Feed', exact: true },
        { route: '/descubrir', label: 'Descubrir' },
        { route: '/novelas', label: 'Novelas' },
        { route: '/mundos', label: 'Mundos' },
        { route: '/personajes', label: 'Personajes' },
        { route: '/foro', label: 'Foro' },
        { route: '/comunidades', label: 'Comunidades', exact: true },
        { route: '/novelas/generos', label: 'Explorar generos' },
      ],
    },
    {
      label: 'Comunidad',
      items: [{ route: '/mis-comunidades', label: 'Mis comunidades' }],
    },
    {
      label: 'Autor',
      items: [
        { route: '/mis-novelas', label: 'Mis novelas' },
        { route: '/mis-mundos', label: 'Mis mundos' },
        { route: '/mis-personajes', label: 'Mis personajes' },
        { route: '/referencias-visuales', label: 'Tableros' },
        { route: '/mis-timelines', label: 'Timelines' },
        { route: '/planner', label: 'Planner' },
      ],
    },
    {
      label: 'Biblioteca',
      items: [
        { route: '/biblioteca', label: 'Biblioteca', exact: true },
        { route: '/biblioteca/colecciones', label: 'Colecciones' },
        { route: '/mis-suscripciones', label: 'Suscripciones' },
      ],
    },
    {
      label: 'Herramientas',
      items: [
        { route: '/analytics', label: 'Analytics' },
        { route: '/herramientas/plantillas', label: 'Plantillas' },
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

  isActive(route: string, exact = false): boolean {
    const currentUrl = this.router.url;
    if (exact) {
      return currentUrl === route;
    }
    return currentUrl === route || currentUrl.startsWith(`${route}/`);
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
