import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { SettingsComponent } from './main-menu/settings/settings.component';
import { NewGameComponent } from './main-menu/new-game/new-game.component';
import { LoadGameComponent } from './main-menu/load-game/load-game.component';
import { GameComponent } from './game/game.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Rutas de autenticación
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },

  // Rutas del menú principal
  { path: 'main-menu', component: MainMenuComponent },
  { path: 'settings', component: SettingsComponent },

  // Rutas de juego
  { path: 'game/new', component: NewGameComponent },
  { path: 'game/load', component: LoadGameComponent },
  { path: 'game', component: GameComponent },

  // Ruta de fallback
  { path: '**', redirectTo: '/auth/login' }
];
