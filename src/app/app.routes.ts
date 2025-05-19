import { Routes } from '@angular/router';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { SettingsComponent } from './main-menu/settings/settings.component';
import { NewGameComponent } from './main-menu/new-game/new-game.component';
import { LoadGameComponent } from './main-menu/load-game/load-game.component';
import { GameComponent } from './game/game.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Rutas de autenticación cargadas de forma dinámica
  { 
    path: 'auth', 
    loadChildren: () => import('./auth/auth.routes').then(mod => mod.AUTH_ROUTES) 
  },

  // Rutas del menú principal
  { 
    path: 'main-menu', 
    component: MainMenuComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'settings', 
    component: SettingsComponent,
    canActivate: [authGuard]
  },

  // Rutas de juego
  { 
    path: 'game/new', 
    component: NewGameComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'game/load', 
    component: LoadGameComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'game', 
    component: GameComponent,
    canActivate: [authGuard]
  },

  // Ruta de fallback
  { path: '**', redirectTo: '/auth/login' }
];
