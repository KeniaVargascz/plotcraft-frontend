import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { anonymousMatchGuard, authenticatedMatchGuard } from './core/guards/session-match.guard';
import { MinimalLayoutComponent } from './layout/minimal-layout/minimal-layout.component';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './layout/private-layout/private-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/landing/landing.component').then((module) => module.LandingComponent),
      },
    ],
  },
  {
    path: '',
    component: PublicLayoutComponent,
    canMatch: [anonymousMatchGuard],
    children: [
      {
        path: 'explorar',
        loadComponent: () =>
          import('./features/feed/explore-page/explore-page.component').then(
            (module) => module.ExplorePageComponent,
          ),
      },
      {
        path: 'perfil/:username',
        loadComponent: () =>
          import('./features/users/user-profile-page/user-profile-page.component').then(
            (module) => module.UserProfilePageComponent,
          ),
      },
      {
        path: 'perfil/:username/seguidores',
        loadComponent: () =>
          import('./features/users/followers-list/followers-list.component').then(
            (module) => module.FollowersListComponent,
          ),
      },
      {
        path: 'perfil/:username/siguiendo',
        loadComponent: () =>
          import('./features/users/following-list/following-list.component').then(
            (module) => module.FollowingListComponent,
          ),
      },
      {
        path: 'novelas',
        loadComponent: () =>
          import('./features/novels/catalog-page.component').then(
            (module) => module.CatalogPageComponent,
          ),
      },
      {
        path: 'novelas/:slug',
        loadComponent: () =>
          import('./features/novels/novel-detail-page.component').then(
            (module) => module.NovelDetailPageComponent,
          ),
      },
    ],
  },
  {
    path: '',
    component: PrivateLayoutComponent,
    canMatch: [authenticatedMatchGuard],
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        redirectTo: '/feed',
        pathMatch: 'full',
      },
      {
        path: 'feed',
        loadComponent: () =>
          import('./features/feed/feed-page/feed-page.component').then(
            (module) => module.FeedPageComponent,
          ),
      },
      {
        path: 'explorar',
        loadComponent: () =>
          import('./features/feed/explore-page/explore-page.component').then(
            (module) => module.ExplorePageComponent,
          ),
      },
      {
        path: 'perfil/:username',
        loadComponent: () =>
          import('./features/users/user-profile-page/user-profile-page.component').then(
            (module) => module.UserProfilePageComponent,
          ),
      },
      {
        path: 'perfil/:username/seguidores',
        loadComponent: () =>
          import('./features/users/followers-list/followers-list.component').then(
            (module) => module.FollowersListComponent,
          ),
      },
      {
        path: 'perfil/:username/siguiendo',
        loadComponent: () =>
          import('./features/users/following-list/following-list.component').then(
            (module) => module.FollowingListComponent,
          ),
      },
      {
        path: 'novelas',
        loadComponent: () =>
          import('./features/novels/catalog-page.component').then(
            (module) => module.CatalogPageComponent,
          ),
      },
      {
        path: 'novelas/:slug',
        loadComponent: () =>
          import('./features/novels/novel-detail-page.component').then(
            (module) => module.NovelDetailPageComponent,
          ),
      },
      {
        path: 'mis-novelas',
        loadComponent: () =>
          import('./features/novels/my-novels-page.component').then(
            (module) => module.MyNovelsPageComponent,
          ),
      },
      {
        path: 'mis-novelas/nueva',
        loadComponent: () =>
          import('./features/novels/novel-form-page.component').then(
            (module) => module.NovelFormPageComponent,
          ),
      },
      {
        path: 'mis-novelas/:slug/editar',
        loadComponent: () =>
          import('./features/novels/novel-form-page.component').then(
            (module) => module.NovelFormPageComponent,
          ),
      },
      {
        path: 'mis-novelas/:slug/capitulos',
        loadComponent: () =>
          import('./features/novels/novel-chapters-page.component').then(
            (module) => module.NovelChaptersPageComponent,
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((module) => module.PROFILE_ROUTES),
      },
    ],
  },
  {
    path: '',
    component: MinimalLayoutComponent,
    children: [
      {
        path: 'novelas/:slug/:chSlug',
        loadComponent: () =>
          import('./features/novels/chapter-reader-page.component').then(
            (module) => module.ChapterReaderPageComponent,
          ),
      },
    ],
  },
  {
    path: '',
    component: MinimalLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'mis-novelas/:slug/capitulos/nuevo',
        loadComponent: () =>
          import('./features/novels/chapter-editor-page.component').then(
            (module) => module.ChapterEditorPageComponent,
          ),
      },
      {
        path: 'mis-novelas/:slug/capitulos/:chSlug/editar',
        loadComponent: () =>
          import('./features/novels/chapter-editor-page.component').then(
            (module) => module.ChapterEditorPageComponent,
          ),
      },
    ],
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((module) => module.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (module) => module.RegisterComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
