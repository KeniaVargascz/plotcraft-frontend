import { Injectable, signal } from '@angular/core';

export type PlotcraftTheme = 'ink' | 'parchment' | 'midnight' | 'forest';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'plotcraft_theme';
  readonly theme = signal<PlotcraftTheme>('ink');
  readonly themes: PlotcraftTheme[] = ['ink', 'parchment', 'midnight', 'forest'];

  initializeTheme(): void {
    const storedTheme = localStorage.getItem(this.storageKey) as PlotcraftTheme | null;
    this.applyTheme(storedTheme ?? 'ink');
  }

  applyTheme(theme: PlotcraftTheme): void {
    this.theme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.storageKey, theme);
  }
}
