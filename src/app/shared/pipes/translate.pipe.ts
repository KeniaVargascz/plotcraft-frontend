import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  // Rendimiento: pipe puro para evitar re-ejecución en cada ciclo de change detection.
  // Seguro porque el idioma se carga una vez en app.config.ts y no cambia en runtime.
  // Si en el futuro se implementa cambio de idioma dinámico (sin recargar),
  // habrá que invalidar el pipe pasando un parámetro reactivo extra:
  //   {{ 'key' | translate : params : langSignal() }}
  // o migrar a llamadas directas con translationService.translate() en computed signals.
  pure: true,
})
export class TranslatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  transform(value: string, params?: Record<string, string | number>): string {
    return this.translationService.translate(value, params);
  }
}
