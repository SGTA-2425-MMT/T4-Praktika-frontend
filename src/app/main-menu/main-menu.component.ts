import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.scss'
})
export class MainMenuComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  newGame() {
    // Navegar a la pantalla de nueva partida
    this.router.navigate(['/game/new']);
  }

  loadGame() {
    // Navegar a la pantalla de cargar partida
    this.router.navigate(['/game/load']);
  }

  goToSettings() {
    // Navegar a la pantalla de configuración
    this.router.navigate(['/settings']);
  }

  logout() {
    this.authService.logout();
  }
}
