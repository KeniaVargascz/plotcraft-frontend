import { Routes } from '@angular/router';

export const PLANNER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./planner-dashboard-page.component').then(
        (m) => m.PlannerDashboardPageComponent,
      ),
  },
  {
    path: 'calendario',
    loadComponent: () =>
      import('./planner-calendar-page.component').then(
        (m) => m.PlannerCalendarPageComponent,
      ),
  },
  {
    path: 'estadisticas',
    loadComponent: () =>
      import('./planner-stats-page.component').then(
        (m) => m.PlannerStatsPageComponent,
      ),
  },
];
