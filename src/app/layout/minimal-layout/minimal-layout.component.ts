import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-minimal-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="minimal-shell">
      <router-outlet />
    </div>
  `,
  styles: [
    `
      .minimal-shell {
        min-height: 100vh;
        padding: 1.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinimalLayoutComponent {}
