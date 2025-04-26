import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/main-menu',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'main-menu',
    loadComponent: () => import('./main-menu/main-menu.component').then(c => c.MainMenuComponent)
  },
  {
    path: 'game',
    loadComponent: () => import('./game/game.component').then(c => c.GameComponent)
  },
  {
    path: 'game/new',
    loadComponent: () => import('./main-menu/new-game/new-game.component').then(c => c.NewGameComponent)
  },
  {
    path: 'game/load',
    loadComponent: () => import('./main-menu/load-game/load-game.component').then(c => c.LoadGameComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./main-menu/settings/settings.component').then(c => c.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: '/main-menu'
  }
];
