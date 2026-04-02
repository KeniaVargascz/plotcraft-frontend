import { Routes } from '@angular/router';

export const FEED_ROUTES: Routes = [
  {
    path: 'feed',
    loadComponent: () =>
      import('./feed-page/feed-page.component').then((module) => module.FeedPageComponent),
  },
  {
    path: 'explorar',
    loadComponent: () =>
      import('./explore-page/explore-page.component').then((module) => module.ExplorePageComponent),
  },
];
