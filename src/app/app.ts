import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { MaintenanceService } from './core/services/maintenance.service';
import { MaintenanceScreenComponent } from './shared/components/maintenance-screen/maintenance-screen.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MaintenanceScreenComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly maintenance = inject(MaintenanceService);
  readonly loading = signal(true);

  constructor() {
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationEnd),
      take(1),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe(() => this.loading.set(false));
  }
}
