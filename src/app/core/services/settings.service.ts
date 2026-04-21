import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PrivacySettings } from '../models/privacy-settings.model';
import { NotificationPreferences } from '../models/notification-preferences.model';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(HttpApiService);

  getPrivacy(): Observable<PrivacySettings> {
    return this.api.get<PrivacySettings>('/settings/privacy');
  }

  updatePrivacy(payload: Partial<PrivacySettings>): Observable<PrivacySettings> {
    return this.api.patch<PrivacySettings>('/settings/privacy', payload);
  }

  getNotificationPrefs(): Observable<NotificationPreferences> {
    return this.api.get<NotificationPreferences>('/settings/notifications');
  }

  updateNotificationPrefs(
    payload: Partial<NotificationPreferences>,
  ): Observable<NotificationPreferences> {
    return this.api.patch<NotificationPreferences>('/settings/notifications', payload);
  }

  exportData(): Observable<Blob> {
    const { http, baseUrl } = this.api.raw();
    return http.post(`${baseUrl}/settings/export`, {}, { responseType: 'blob' });
  }
}
