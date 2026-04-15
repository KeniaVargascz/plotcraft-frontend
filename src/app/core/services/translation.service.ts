import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly dictionary = signal<Record<string, unknown>>({});
  readonly currentLanguage = signal('es');

  async loadTranslations(language = this.currentLanguage()): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<Record<string, unknown>>(`/assets/i18n/${language}.json`),
    );
    this.currentLanguage.set(language);
    this.dictionary.set(data);
  }

  async setLanguage(language: string): Promise<void> {
    await this.loadTranslations(language);
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
