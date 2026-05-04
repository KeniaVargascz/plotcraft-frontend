import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
}
