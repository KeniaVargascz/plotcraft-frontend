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
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/landing/landing.component').then((module) => module.LandingComponent),
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
        path: 'descubrir',
        loadComponent: () =>
          import('./features/discovery/discovery-page.component').then(
            (module) => module.DiscoveryPageComponent,
          ),
      },
      {
        path: 'buscar',
        loadComponent: () =>
          import('./features/search/search-page.component').then(
            (module) => module.SearchPageComponent,
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
        path: 'mundos',
        loadComponent: () =>
          import('./features/worlds/worlds-catalog-page.component').then(
            (module) => module.WorldsCatalogPageComponent,
          ),
      },
      {
        path: 'mundos/:slug',
        loadComponent: () =>
          import('./features/worlds/world-detail-page.component').then(
            (module) => module.WorldDetailPageComponent,
          ),
      },
      {
        path: 'personajes',
        loadComponent: () =>
          import('./features/characters/characters-catalog-page.component').then(
            (module) => module.CharactersCatalogPageComponent,
          ),
      },
      {
        path: 'personajes/:username/:slug',
        loadComponent: () =>
          import('./features/characters/character-detail-page.component').then(
            (module) => module.CharacterDetailPageComponent,
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
        path: 'mis-mundos',
        loadComponent: () =>
          import('./features/worlds/my-worlds-page.component').then(
            (module) => module.MyWorldsPageComponent,
          ),
      },
      {
        path: 'mis-mundos/nuevo',
        loadComponent: () =>
          import('./features/worlds/world-form-page.component').then(
            (module) => module.WorldFormPageComponent,
          ),
      },
      {
        path: 'mis-mundos/:slug/editar',
        loadComponent: () =>
          import('./features/worlds/world-form-page.component').then(
            (module) => module.WorldFormPageComponent,
          ),
      },
      {
        path: 'mis-personajes',
        loadComponent: () =>
          import('./features/characters/my-characters-page.component').then(
            (module) => module.MyCharactersPageComponent,
          ),
      },
      {
        path: 'mis-personajes/nuevo',
        loadComponent: () =>
          import('./features/characters/character-form-page.component').then(
            (module) => module.CharacterFormPageComponent,
          ),
      },
      {
        path: 'mis-personajes/:slug/editar',
        loadComponent: () =>
          import('./features/characters/character-form-page.component').then(
            (module) => module.CharacterFormPageComponent,
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
        path: 'biblioteca',
        loadComponent: () =>
          import('./features/library/library-page.component').then(
            (module) => module.LibraryPageComponent,
          ),
      },
      {
        path: 'biblioteca/en-progreso',
        loadComponent: () =>
          import('./features/library/in-progress-page.component').then(
            (module) => module.InProgressPageComponent,
          ),
      },
      {
        path: 'biblioteca/historial',
        loadComponent: () =>
          import('./features/library/history-page.component').then(
            (module) => module.HistoryPageComponent,
          ),
      },
      {
        path: 'biblioteca/marcadores',
        loadComponent: () =>
          import('./features/library/bookmarks-page.component').then(
            (module) => module.BookmarksPageComponent,
          ),
      },
      {
        path: 'biblioteca/subrayados',
        loadComponent: () =>
          import('./features/library/highlights-page.component').then(
            (module) => module.HighlightsPageComponent,
          ),
      },
      {
        path: 'biblioteca/listas',
        loadComponent: () =>
          import('./features/library/reading-lists-page.component').then(
            (module) => module.ReadingListsPageComponent,
          ),
      },
      {
        path: 'biblioteca/listas/:id',
        loadComponent: () =>
          import('./features/library/reading-list-detail-page.component').then(
            (module) => module.ReadingListDetailPageComponent,
          ),
      },
      {
        path: 'biblioteca/metas',
        loadComponent: () =>
          import('./features/library/goals-page.component').then(
            (module) => module.GoalsPageComponent,
          ),
      },
      {
        path: 'biblioteca/estadisticas',
        loadComponent: () =>
          import('./features/library/stats-page.component').then(
            (module) => module.StatsPageComponent,
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
        path: 'descubrir',
        loadComponent: () =>
          import('./features/discovery/discovery-page.component').then(
            (module) => module.DiscoveryPageComponent,
          ),
      },
      {
        path: 'buscar',
        loadComponent: () =>
          import('./features/search/search-page.component').then(
            (module) => module.SearchPageComponent,
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
        path: 'mundos',
        loadComponent: () =>
          import('./features/worlds/worlds-catalog-page.component').then(
            (module) => module.WorldsCatalogPageComponent,
          ),
      },
      {
        path: 'mundos/:slug',
        loadComponent: () =>
          import('./features/worlds/world-detail-page.component').then(
            (module) => module.WorldDetailPageComponent,
          ),
      },
      {
        path: 'personajes',
        loadComponent: () =>
          import('./features/characters/characters-catalog-page.component').then(
            (module) => module.CharactersCatalogPageComponent,
          ),
      },
      {
        path: 'personajes/:username/:slug',
        loadComponent: () =>
          import('./features/characters/character-detail-page.component').then(
            (module) => module.CharacterDetailPageComponent,
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
