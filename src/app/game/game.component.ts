import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MapViewComponent } from './map/map-view/map-view.component';
import { TechTreeComponent } from './technology/tech-tree/tech-tree.component';
import { NotificationPanelComponent } from './notification-panel/notification-panel.component';
import { GameService, GameSession } from '../core/services/game.service';
import { DebugService } from '../core/services/debug.service';
import { CheatService } from '../core/services/cheat.service';
import { CheatConsoleComponent } from './cheat-console/cheat-console.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, MapViewComponent, TechTreeComponent, NotificationPanelComponent, CheatConsoleComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  gameSession: GameSession | null = null;
  loading = true;
  error = '';
  subscription: Subscription = new Subscription();
  showTechTree = false; // Estado para mostrar/ocultar el árbol tecnológico

  // Referencia al componente de consola de trucos
  @ViewChild(CheatConsoleComponent) cheatConsoleRef!: CheatConsoleComponent;
  @ViewChild(MapViewComponent) mapViewRef!: MapViewComponent;

  // Estado para mostrar/ocultar la consola de trucos
  showCheatConsole = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gameService: GameService,
    private readonly debugService: DebugService,
    public cheatService: CheatService
  ) { }

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

  async saveGame(): Promise<void> {
      try {
        const result = await this.gameService.saveGame();
        if (result) {
          // Mostrar mensaje de éxito
          alert('Partida guardada correctamente');
        } else {
          alert('Ha ocurrido un error al guardar la partida');
        }
      } catch {
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

  async endTurn(): Promise<void> {
    // Usar el nuevo flujo: solo actualiza el estado del juego
    const result = await this.gameService.endTurnWithApi();
    this.gameSession = this.gameService.currentGame;
    // Si se desea animar cambios de unidades IA, aquí se puede comparar el estado anterior y el nuevo
    // y pasar los cambios a mapViewRef.animateAIUnitUpdates().
    this.showNewTurnNotification();
    this.startTurn();
  }

  private startTurn(): void {
    // Esta función puede usarse para inicializar cosas al principio del turno
    if (!this.gameSession) return;
    console.log(`Iniciando turno ${this.gameSession.turn} en fase ${this.gameSession.currentPhase}`);
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
    if (!this.gameSession?.currentPhase) return 'Diplomacia y Decisiones';

    switch (this.gameSession.currentPhase) {
      case 'diplomacia_decisiones': return 'Diplomacia y Decisiones';
      case 'creacion_investigacion': return 'Construcción e Investigación';
      case 'movimiento_accion': return 'Movimiento y Acción';
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

  // Método para mostrar u ocultar el árbol tecnológico
  toggleTechTree(): void {
    this.showTechTree = !this.showTechTree;
    console.log(`${this.showTechTree ? 'Mostrando' : 'Ocultando'} árbol tecnológico`);
  }

  // Escuchar teclas para depuración
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // F9 para mostrar información de ciencia
    if (event.key === 'F9') {
      console.log("Ejecutando diagnóstico de ciencia...");
      this.debugService.debugScienceStatus();
    }

    // Shift+F9 para corregir problemas de ciencia
    if (event.key === 'F9' && event.shiftKey) {
      console.log("Corrigiendo problemas de ciencia...");
      this.debugService.fixScienceIssues();
      alert("Se ha aplicado una corrección a la producción de ciencia. Verifica la consola para más detalles.");
    }

    // Ctrl+F9 para forzar actualización de investigación
    if (event.key === 'F9' && event.ctrlKey) {
      console.log("Forzando actualización de la investigación...");
      this.debugService.forceResearchUpdate();
      alert("Se ha forzado la actualización de la investigación. Verifica la consola para más detalles.");
    }

    // Ctrl+T para abrir la ventana de trucos (considera también 't' minúscula)
    if (event.ctrlKey && (event.key === 'T' || event.key === 't')) {
      console.log("Ctrl+T detectado. Abriendo ventana de trucos...");
      event.preventDefault(); // Prevenir el comportamiento por defecto de Ctrl+T
      this.openCheatInput();
    }
  }

  openCheatInput(): void {
    console.log("Abriendo consola de trucos, estado actual:", this.showCheatConsole);
    this.showCheatConsole = true;
    setTimeout(() => {
      // Forzar que el focus vaya a la consola
      const inputElement = document.querySelector('.console-input input');
      if (inputElement) {
        (inputElement as HTMLElement).focus();
      }
    }, 100);
  }

  executeCheat(command: string): void {
    const context = this.getCurrentGameContext();
    const result = this.cheatService.executeCheat(command, context);

    // Enviar respuesta al componente de la consola de trucos
    if (this.cheatConsoleRef) {
      this.cheatConsoleRef.addResponse(result);
    }
  }

  closeCheatConsole(): void {
    this.showCheatConsole = false;
  }

  getCurrentGameContext(): any {
    return {
      gameId: this.gameSession?.id,
      gameName: this.gameSession?.name,
      currentTurn: this.gameSession?.turn,
      currentPhase: this.gameSession?.currentPhase,
      currentPlayer: this.gameSession?.currentPlayerId
    };
  }
}
