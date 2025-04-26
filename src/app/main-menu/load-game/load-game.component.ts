import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService, GameSession } from '../../core/services/game.service';

@Component({
  selector: 'app-load-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './load-game.component.html',
  styleUrl: './load-game.component.scss'
})
export class LoadGameComponent implements OnInit {
  savedGames: GameSession[] = [];
  selectedGame: GameSession | null = null;

  constructor(
    private router: Router,
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    // Cargar la lista de partidas guardadas
    this.savedGames = this.gameService.getSavedGames();
  }

  selectGame(game: GameSession): void {
    this.selectedGame = game;
  }

  loadGame(): void {
    if (!this.selectedGame) {
      alert('Por favor, selecciona una partida para cargar');
      return;
    }
    
    // Navegar a la pantalla de juego con el ID de la partida
    this.router.navigate(['/game'], { queryParams: { load: this.selectedGame.id } });
  }

  deleteGame(game: GameSession, event: Event): void {
    event.stopPropagation();  // Evitar que se seleccione el juego al eliminar
    
    const confirmed = confirm(`¿Estás seguro de que quieres eliminar la partida "${game.name}"?`);
    if (confirmed) {
      if (this.gameService.deleteGame(game.id)) {
        // Actualizar la lista después de eliminar
        this.savedGames = this.gameService.getSavedGames();
        
        // Si el juego eliminado era el seleccionado, limpiar la selección
        if (this.selectedGame && this.selectedGame.id === game.id) {
          this.selectedGame = null;
        }
      }
    }
  }

  returnToMainMenu(): void {
    this.router.navigate(['/main-menu']);
  }

  // Métodos de ayuda para mostrar información
  getFormattedDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  getPlayTime(game: GameSession): string {
    // En una implementación real, aquí calcularíamos el tiempo de juego
    return game.turn * 3 + 'm'; // Simulación simple (3 minutos por turno)
  }
}
