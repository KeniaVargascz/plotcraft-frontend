import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withInMemoryScrolling,
} from '@angular/router';
import { provideQuillConfig } from 'ngx-quill';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { TranslationService } from './core/services/translation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
    provideAppInitializer(() => {
      inject(ThemeService).initializeTheme();
      return Promise.all([
        inject(TranslationService).loadTranslations(),
        inject(AuthService).initializeSession(),
      ]);
    }),
    provideQuillConfig({
      theme: 'snow',
      // Tamanos y alineacion como estilo inline -> HTML portable para el reader.
      // La sangria (indent) usa el atributo de clase por defecto de Quill 2,
      // ya que la version inline-style no existe; ver styles.scss para CSS global.
      customOptions: [
        {
          import: 'attributors/style/size',
          whitelist: ['0.85rem', false, '1.25rem', '1.6rem'],
        },
        {
          import: 'attributors/style/align',
          whitelist: [false, 'center', 'right', 'justify'],
        },
      ],
      format: 'html',
      formats: ['bold', 'italic', 'size', 'align', 'indent', 'list'],
    }),
  ],
};
