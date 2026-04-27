import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
  input,
} from '@angular/core';
import { FeatureFlagService } from '../../core/services/feature-flag.service';
import type { FeatureFlagKey } from '../../core/constants/feature-flags.constants';

@Directive({
  selector: '[appFeature]',
  standalone: true,
})
export class FeatureFlagDirective {
  private readonly featureFlags = inject(FeatureFlagService);
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private hasView = false;

  readonly appFeature = input.required<FeatureFlagKey>();

  constructor() {
    effect(() => {
      const key = this.appFeature();
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
