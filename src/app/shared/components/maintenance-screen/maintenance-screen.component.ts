import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-maintenance-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .maintenance-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: var(--bg-base, #09070a);
      color: var(--text-1, #f0e8d0);
      font-family: system-ui, sans-serif;
      padding: 2rem;
      text-align: center;
    }
    .content { max-width: 480px; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--accent, #c9a84c);
      margin-bottom: 0.75rem;
    }
    p {
      font-size: 1rem;
      color: var(--text-2, #9088a0);
      line-height: 1.6;
    }
  `],
  template: `
    <div class="maintenance-shell">
      <div class="content">
        <div class="icon">🔧</div>
        <h1>En mantenimiento</h1>
        <p>
          Estamos realizando mejoras en la plataforma.
          Vuelve en unos minutos.
        </p>
      </div>
    </div>
  `,
})
export class MaintenanceScreenComponent {}
