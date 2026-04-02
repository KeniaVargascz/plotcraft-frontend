import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly dictionary = signal<Record<string, unknown>>({});

  async loadTranslations(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<Record<string, unknown>>('/assets/i18n/es.json'),
    );
    this.dictionary.set(data);
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const value = key.split('.').reduce<unknown>((accumulator, current) => {
      if (accumulator && typeof accumulator === 'object' && current in accumulator) {
        return (accumulator as Record<string, unknown>)[current];
      }

      return key;
    }, this.dictionary());

    if (typeof value !== 'string') {
      return key;
    }

    if (!params) {
      return value;
    }

    return Object.entries(params).reduce(
      (result, [paramKey, paramValue]) => result.replaceAll(`{{${paramKey}}}`, String(paramValue)),
      value,
    );
  }
}
