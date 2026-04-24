import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminMatchGuard } from './core/guards/admin-match.guard';
import { anonymousMatchGuard, authenticatedMatchGuard } from './core/guards/session-match.guard';
import { authGateGuard } from './core/guards/auth-gate.guard';
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
        path: 'novelas/generos',
        loadComponent: () =>
          import('./features/novels/genres-page.component').then(
            (module) => module.GenresPageComponent,
          ),
      },
      {
        path: 'novelas/genero/:genreSlug',
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
        path: 'mundos/:slug/lore',
        loadComponent: () =>
          import('./features/worlds/world-lore-page.component').then(
            (module) => module.WorldLorePageComponent,
          ),
      },
      {
        path: 'mundos/:slug/lore/:entrySlug',
        loadComponent: () =>
          import('./features/worlds/worldbuilding/wb-entry-detail-page.component').then(
            (module) => module.WbEntryDetailPageComponent,
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
        path: 'sagas',
        loadComponent: () =>
          import('./features/series/series-catalog-page.component').then(
            (m) => m.SeriesCatalogPageComponent,
          ),
      },
      {
        path: 'mis-sagas',
        redirectTo: 'biblioteca/colecciones',
        pathMatch: 'full',
      },
      {
        path: 'mis-sagas/nueva',
        redirectTo: 'biblioteca/colecciones',
        pathMatch: 'full',
      },
      {
        path: 'mis-sagas/:slug/editar',
        loadComponent: () =>
          import('./features/series/series-form-page.component').then(
            (m) => m.SeriesFormPageComponent,
          ),
      },
      {
        path: 'sagas/:slug',
        loadComponent: () =>
          import('./features/series/series-detail-page.component').then(
            (m) => m.SeriesDetailPageComponent,
          ),
      },
      {
        path: 'mis-suscripciones',
        loadComponent: () =>
          import('./features/novels/my-subscriptions-page.component').then(
            (m) => m.MySubscriptionsPageComponent,
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
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/author-analytics-page.component').then(
            (module) => module.AuthorAnalyticsPageComponent,
          ),
      },
      {
        path: 'analytics/novelas/:slug',
        loadComponent: () =>
          import('./features/analytics/novel-analytics-page.component').then(
            (module) => module.NovelAnalyticsPageComponent,
          ),
      },
      {
        path: 'mis-mundos/:slug/mapa',
        loadComponent: () =>
          import('./features/maps/map-editor-page.component').then(
            (module) => module.MapEditorPageComponent,
          ),
      },
      {
        path: 'mis-mundos/:slug/world-building',
        loadComponent: () =>
          import('./features/worlds/worldbuilding/wb-workspace-page.component').then(
            (module) => module.WbWorkspacePageComponent,
          ),
      },
      {
        path: 'mis-mundos/:slug/world-building/:catSlug/nueva',
        loadComponent: () =>
          import('./features/worlds/worldbuilding/wb-entry-form-page.component').then(
            (module) => module.WbEntryFormPageComponent,
          ),
      },
      {
        path: 'mis-mundos/:slug/world-building/:catSlug/:entrySlug/editar',
        loadComponent: () =>
          import('./features/worlds/worldbuilding/wb-entry-form-page.component').then(
            (module) => module.WbEntryFormPageComponent,
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
        path: 'referencias-visuales',
        loadComponent: () =>
          import('./features/visual-boards/my-visual-boards-page.component').then(
            (module) => module.MyVisualBoardsPageComponent,
          ),
      },
      {
        path: 'referencias-visuales/:id',
        loadComponent: () =>
          import('./features/visual-boards/visual-board-page.component').then(
            (module) => module.VisualBoardPageComponent,
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
        path: 'biblioteca/colecciones',
        loadComponent: () =>
          import('./features/library/organize-collections-page.component').then(
            (m) => m.OrganizeCollectionsPageComponent,
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
        path: 'mis-timelines',
        loadComponent: () =>
          import('./features/timeline/timelines-list-page.component').then(
            (module) => module.TimelinesListPageComponent,
          ),
      },
      {
        path: 'mis-timelines/:id',
        loadComponent: () =>
          import('./features/timeline/timeline-canvas-page.component').then(
            (module) => module.TimelineCanvasPageComponent,
          ),
      },
      {
        path: 'planner',
        loadComponent: () =>
          import('./features/planner/planner-dashboard-page.component').then(
            (module) => module.PlannerDashboardPageComponent,
          ),
      },
      {
        path: 'planner/calendario',
        loadComponent: () =>
          import('./features/planner/planner-calendar-page.component').then(
            (module) => module.PlannerCalendarPageComponent,
          ),
      },
      {
        path: 'planner/estadisticas',
        loadComponent: () =>
          import('./features/planner/planner-stats-page.component').then(
            (module) => module.PlannerStatsPageComponent,
          ),
      },
      {
        path: 'planner/:projectId',
        loadComponent: () =>
          import('./features/planner/kanban-board-page.component').then(
            (module) => module.KanbanBoardPageComponent,
          ),
      },
      {
        path: 'herramientas/plantillas',
        loadComponent: () =>
          import('./features/tools/templates-page.component').then(
            (module) => module.TemplatesPageComponent,
          ),
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./features/notifications/notifications-page.component').then(
            (module) => module.NotificationsPageComponent,
          ),
      },
      {
        path: 'foro/nuevo',
        loadComponent: () =>
          import('./features/forum/new-thread-page.component').then(
            (module) => module.NewThreadPageComponent,
          ),
      },
      {
        path: 'foro/archivados',
        loadComponent: () =>
          import('./features/forum/archived-threads-page.component').then(
            (module) => module.ArchivedThreadsPageComponent,
          ),
      },
      {
        path: 'foro',
        loadComponent: () =>
          import('./features/forum/forum-home-page.component').then(
            (module) => module.ForumHomePageComponent,
          ),
      },
      {
        path: 'foro/:slug',
        loadComponent: () =>
          import('./features/forum/thread-detail-page.component').then(
            (module) => module.ThreadDetailPageComponent,
          ),
      },
      {
        path: 'comunidades',
        loadComponent: () =>
          import('./features/communities/followed-communities-page.component').then(
            (m) => m.FollowedCommunitiesPageComponent,
          ),
      },
      {
        path: 'comunidades/explorar',
        loadComponent: () =>
          import('./features/communities/communities-page.component').then(
            (m) => m.CommunitiesPageComponent,
          ),
      },
      {
        path: 'comunidades/nueva',
        loadComponent: () =>
          import('./features/communities/create-community-page.component').then(
            (m) => m.CreateCommunityPageComponent,
          ),
      },
      {
        path: 'comunidades/:slug',
        loadComponent: () =>
          import('./features/communities/community-detail-page.component').then(
            (m) => m.CommunityDetailPageComponent,
          ),
      },
      {
        path: 'comunidades/:slug/foros/:forumSlug',
        loadComponent: () =>
          import('./features/community-forums/forum-page.component').then(
            (m) => m.ForumPageComponent,
          ),
      },
      {
        path: 'comunidades/:slug/foros/:forumSlug/nuevo-hilo',
        loadComponent: () =>
          import('./features/community-forums/create-thread-page.component').then(
            (m) => m.CreateThreadPageComponent,
          ),
      },
      {
        path: 'comunidades/:slug/foros/:forumSlug/hilos/:threadSlug',
        loadComponent: () =>
          import('./features/community-forums/thread-detail-page.component').then(
            (m) => m.CommunityThreadDetailPageComponent,
          ),
      },
      {
        path: 'mis-comunidades',
        loadComponent: () =>
          import('./features/communities/my-communities-page.component').then(
            (m) => m.MyCommunitiesPageComponent,
          ),
      },
      {
        path: 'mis-comunidades/:slug/editar',
        loadComponent: () =>
          import('./features/communities/edit-community-page.component').then(
            (m) => m.EditCommunityPageComponent,
          ),
      },
      {
        path: 'admin/comunidades',
        canMatch: [adminMatchGuard],
        loadComponent: () =>
          import('./features/communities/admin-communities-page.component').then(
            (m) => m.AdminCommunitiesPageComponent,
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
        path: 'novelas/generos',
        loadComponent: () =>
          import('./features/novels/genres-page.component').then(
            (module) => module.GenresPageComponent,
          ),
      },
      {
        path: 'novelas/genero/:genreSlug',
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
        path: 'mundos/:slug/lore',
        canActivate: [authGateGuard],
        loadComponent: () =>
          import('./features/worlds/world-lore-page.component').then(
            (module) => module.WorldLorePageComponent,
          ),
      },
      {
        path: 'mundos/:slug/lore/:entrySlug',
        canActivate: [authGateGuard],
        loadComponent: () =>
          import('./features/worlds/worldbuilding/wb-entry-detail-page.component').then(
            (module) => module.WbEntryDetailPageComponent,
          ),
      },
      {
        path: 'mundos/:slug',
        canActivate: [authGateGuard],
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
        canActivate: [authGateGuard],
        loadComponent: () =>
          import('./features/characters/character-detail-page.component').then(
            (module) => module.CharacterDetailPageComponent,
          ),
      },
      {
        path: 'novelas/:slug',
        canActivate: [authGateGuard],
        loadComponent: () =>
          import('./features/novels/novel-detail-page.component').then(
            (module) => module.NovelDetailPageComponent,
          ),
      },
      {
        path: 'sagas',
        loadComponent: () =>
          import('./features/series/series-catalog-page.component').then(
            (m) => m.SeriesCatalogPageComponent,
          ),
      },
      {
        path: 'sagas/:slug',
        canActivate: [authGateGuard],
        loadComponent: () =>
          import('./features/series/series-detail-page.component').then(
            (m) => m.SeriesDetailPageComponent,
          ),
      },
      {
        path: 'foro',
        loadComponent: () =>
          import('./features/forum/forum-home-page.component').then(
            (module) => module.ForumHomePageComponent,
          ),
      },
      {
        path: 'foro/:slug',
        canActivate: [authGateGuard],
        loadComponent: () =>
          import('./features/forum/thread-detail-page.component').then(
            (module) => module.ThreadDetailPageComponent,
          ),
      },
      {
        path: 'comunidades',
        loadComponent: () =>
          import('./features/communities/communities-page.component').then(
            (m) => m.CommunitiesPageComponent,
          ),
      },
      {
        path: 'comunidades/:slug',
        canActivate: [authGateGuard],
        loadComponent: () =>
          import('./features/communities/community-detail-page.component').then(
            (m) => m.CommunityDetailPageComponent,
          ),
      },
      {
        path: 'referencias-visuales/:id',
        canActivate: [authGateGuard],
        loadComponent: () =>
          import('./features/visual-boards/visual-board-page.component').then(
            (module) => module.VisualBoardPageComponent,
          ),
      },
      { path: 'feed', redirectTo: '/login', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: '/login', pathMatch: 'full' },
      { path: 'mi-perfil', redirectTo: '/login', pathMatch: 'full' },
      { path: 'mi-perfil/editar', redirectTo: '/login' },
      { path: 'cuenta', redirectTo: '/login', pathMatch: 'full' },
      { path: 'cuenta/eliminar', redirectTo: '/login' },
      { path: 'mis-novelas', redirectTo: '/login', pathMatch: 'full' },
      { path: 'mis-mundos', redirectTo: '/login', pathMatch: 'full' },
      { path: 'mis-personajes', redirectTo: '/login', pathMatch: 'full' },
      { path: 'mis-comunidades', redirectTo: '/login', pathMatch: 'full' },
      { path: 'mis-timelines', redirectTo: '/login', pathMatch: 'full' },
      { path: 'mis-suscripciones', redirectTo: '/login', pathMatch: 'full' },
      { path: 'biblioteca', redirectTo: '/login', pathMatch: 'full' },
      { path: 'planner', redirectTo: '/login', pathMatch: 'full' },
      { path: 'analytics', redirectTo: '/login', pathMatch: 'full' },
      { path: 'notificaciones', redirectTo: '/login', pathMatch: 'full' },
      { path: 'referencias-visuales', redirectTo: '/login', pathMatch: 'full' },
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
      import('./auth/components/login-form/login-form.component').then(
        (module) => module.LoginFormComponent,
      ),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/components/register-form/register-form.component').then(
        (module) => module.RegisterFormComponent,
      ),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/components/forgot-password/forgot-password.component').then(
        (module) => module.ForgotPasswordComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
