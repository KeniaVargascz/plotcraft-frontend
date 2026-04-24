import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
} from '@angular/core';
import { FeatureFlagService } from '../../core/services/feature-flag.service';

@Directive({
  selector: '[appFeature]',
  standalone: true,
})
export class FeatureFlagDirective {
  private readonly featureFlags = inject(FeatureFlagService);
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private hasView = false;

  @Input()
  set appFeature(key: string) {
    effect(() => {
      const enabled = this.featureFlags.enabled(key)();
      if (enabled && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!enabled && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
