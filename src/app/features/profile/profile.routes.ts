import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: 'mi-perfil',
    loadComponent: () =>
      import('./my-profile/my-profile.component').then((module) => module.MyProfileComponent),
  },
  {
    path: 'mi-perfil/editar',
    loadComponent: () =>
      import('./edit-profile/edit-profile.component').then((module) => module.EditProfileComponent),
  },
  {
    path: 'cuenta',
    loadComponent: () =>
      import('./settings/account-settings.component').then(
        (module) => module.AccountSettingsComponent,
      ),
  },
  {
    path: 'cuenta/eliminar',
    loadComponent: () =>
      import('./settings/delete-account/delete-account.component').then(
        (module) => module.DeleteAccountComponent,
      ),
  },
];
