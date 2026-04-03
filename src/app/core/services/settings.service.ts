import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PrivacySettings } from '../models/privacy-settings.model';
import { NotificationPreferences } from '../models/notification-preferences.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  getPrivacy(): Observable<PrivacySettings> {
    return this.http
      .get<ApiResponse<PrivacySettings>>(`${this.baseUrl}/privacy`)
      .pipe(map((response) => response.data));
  }

  updatePrivacy(payload: Partial<PrivacySettings>): Observable<PrivacySettings> {
    return this.http
      .patch<ApiResponse<PrivacySettings>>(`${this.baseUrl}/privacy`, payload)
      .pipe(map((response) => response.data));
  }

  getNotificationPrefs(): Observable<NotificationPreferences> {
    return this.http
      .get<ApiResponse<NotificationPreferences>>(`${this.baseUrl}/notifications`)
      .pipe(map((response) => response.data));
  }

  updateNotificationPrefs(
    payload: Partial<NotificationPreferences>,
  ): Observable<NotificationPreferences> {
    return this.http
      .patch<ApiResponse<NotificationPreferences>>(`${this.baseUrl}/notifications`, payload)
      .pipe(map((response) => response.data));
  }

  exportData(): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/export`, {}, { responseType: 'blob' });
  }
}
