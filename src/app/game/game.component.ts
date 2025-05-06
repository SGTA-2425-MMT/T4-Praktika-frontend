import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MapViewComponent } from './map/map-view/map-view.component';
import { GameService, GameSession } from '../core/services/game.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, MapViewComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  gameSession: GameSession | null = null;
  loading = true;
  error = '';
  subscription: Subscription = new Subscription();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en la partida actual
    this.subscription = this.gameService.currentGame$.subscribe(game => {
      this.gameSession = game;
      
      // Si no hay partida activa, crear una por defecto
      if (!game) {
        this.createDefaultGame();
      } else {
        this.loading = false;
      }
    });

    // Comprobar parámetros de la URL
    this.route.queryParams.subscribe(params => {
      if (params['load']) {
        // Si existe el parámetro 'load', cargar la partida
        const loadedGame = this.gameService.loadGame(params['load']);
        if (!loadedGame) {
          this.error = 'No se ha podido cargar la partida.';
          setTimeout(() => {
            this.router.navigate(['/main-menu']);
          }, 2000);
        }
      } else if (params['new'] === 'true') {
        // Si existe el parámetro 'new', la partida ya debería haber sido creada
        // por el componente NewGameComponent antes de navegar aquí
        if (!this.gameService.currentGame) {
          this.error = 'No se ha configurado correctamente la nueva partida.';
          setTimeout(() => {
            this.router.navigate(['/game/new']);
          }, 2000);
        }
      } else {
        // Si no hay parámetros válidos, redirigir al menú principal
        this.router.navigate(['/main-menu']);
      }
    });
  }

  // Crear una partida por defecto si no se ha cargado ninguna
  createDefaultGame(): void {
    const defaultSettings = {
      gameName: 'Partida por defecto',
      mapSize: 'medium' as 'small' | 'medium' | 'large' | 'huge',
      civilization: 'spain',
      difficulty: 'normal' as 'easy' | 'normal' | 'hard' | 'expert',
      numberOfOpponents: 3
    };
    
    this.gameSession = this.gameService.createNewGame(defaultSettings);
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  saveGame(): void {
    if (this.gameService.saveGame()) {
      // Mostrar mensaje de éxito
      alert('Partida guardada correctamente');
    } else {
      alert('Ha ocurrido un error al guardar la partida');
    }
  }

  exitToMenu(): void {
    const confirmExit = confirm('¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.');
    if (confirmExit) {
      this.gameService.exitGame();
      this.router.navigate(['/main-menu']);
    }
  }

  endTurn(): void {
    // Ahora este método simplemente llama a la función en el servicio
    this.gameService.endTurn();
    this.gameSession = this.gameService.currentGame;
    this.showNewTurnNotification();
  }

  private showNewTurnNotification(): void {
    if (!this.gameSession) return;
    
    // Aquí podrías implementar una notificación visual
    console.log(`Comenzando turno ${this.gameSession.turn}`);
    
    // Verificar si hay nuevas unidades o ciudades que crecieron
    // (Funcionalidad que se puede añadir más adelante)
  }

  returnToMainMenu(): void {
    this.router.navigate(['/main-menu']);
  }

  getCurrentPhaseName(): string {
    if (!this.gameSession || !this.gameSession.currentPhase) return 'Movimiento';
    
    switch(this.gameSession.currentPhase) {
      case 'movement': return 'Movimiento';
      case 'action': return 'Acción';
      case 'diplomacy': return 'Diplomacia';
      case 'production': return 'Producción';
      case 'research': return 'Investigación';
      case 'end': return 'Fin del Turno';
      default: return 'Desconocida';
    }
  }

  nextPhase(): void {
    this.gameService.nextPhase();
    this.gameSession = this.gameService.currentGame;
    this.showPhaseNotification();
  }

  private showPhaseNotification(): void {
    // Aquí se podría implementar una animación o notificación visual
    console.log(`Cambiando a fase: ${this.getCurrentPhaseName()}`);
  }
}
