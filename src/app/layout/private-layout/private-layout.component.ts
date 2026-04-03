import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationsPanelComponent } from '../../features/notifications/notifications-panel.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
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
export class PrivateLayoutComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly notificationsService = inject(NotificationsService);

  readonly showNotifications = signal(false);
  readonly unreadCount = signal(0);
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadUnreadCount();
    this.pollInterval = setInterval(() => this.loadUnreadCount(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  toggleNotifications(): void {
    this.showNotifications.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
  }

  private loadUnreadCount(): void {
    this.notificationsService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.count),
    });
  }
}
