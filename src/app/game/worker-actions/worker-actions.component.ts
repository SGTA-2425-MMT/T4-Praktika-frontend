import { Component, Input, Output, EventEmitter, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuildingsService, BuildingType } from '../../core/services/buildings.service';
import { GameService, GameSession } from '../../core/services/game.service';
import { MapTile } from '../../core/models/map.model';
import { Unit, UnitAction } from '../../core/models/unit.model';
import { BUILDING_TEMPLATES, Building } from '../../core/models/building.model';
import { ImprovementType } from '../../core/models/map.model';
import { TileImprovementService } from '../../core/services/tile-improvement.service';

@Component({
  selector: 'app-worker-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './worker-actions.component.html',
  styleUrl: './worker-actions.component.scss'
})
export class WorkerActionsComponent {
  @Input() worker: Unit | null = null;
  @Input() currentTile: MapTile | null = null;
  @Output() actionSelected = new EventEmitter<UnitAction>();
  @Output() cancelAction = new EventEmitter<void>();

  availableImprovements: any[] = [];
  canRemoveFeature: boolean = false;
  canBuildRoad: boolean = true; // Simplificado por ahora

  constructor(
    private readonly buildingsService: BuildingsService,
    private readonly gameService: GameService,
    private readonly injector: Injector // Needed to get TileImprovementService
  ) { }

  ngOnChanges(): void {
    this.updateAvailableActions();
  }

  updateAvailableActions(): void {
    console.log("Actualizando acciones disponibles del trabajador (solo buildingsService)");

    if (!this.worker || !this.currentTile) {
      this.availableImprovements = [];
      this.canRemoveFeature = false;
      console.log('[updateAvailableActions] No hay worker o currentTile');
      return;
    }

    this.canRemoveFeature = false;

    const tile = this.currentTile;
    const gameSession = this.gameService.currentGame;
    if (!tile || !gameSession) {
      this.availableImprovements = [];
      return;
    }

    // Only show improvements that are in ImprovementType or are 'road' (if workers can build roads)
    const validImprovementTypes: string[] = [
      'farm', 'road', 'gold_mine', 'port'
    ];
    this.availableImprovements = (BUILDING_TEMPLATES)
      .filter(template => validImprovementTypes.includes(template.type))
      .map(template => {
        const canBuildResult = this.buildingsService.canBuildBuilding(template.type, tile.x, tile.y, gameSession);
        return {
          type: template.type,
          name: template.name,
          icon: template.icon,
          description: template.description,
          turns: template.turnsToBuild,
          canBuild: canBuildResult.canBuild,
          reason: canBuildResult.reason || ''
        };
      });
    console.log(`[updateAvailableActions] Mejoras disponibles (data-driven): ${this.availableImprovements.length}`);
    if (this.availableImprovements.length > 0) {
      console.log('[updateAvailableActions] Mejoras disponibles:', this.availableImprovements.map(imp => imp.name).join(', '));
    }
  }

  // Mueve aquí la lógica de buildImprovement
  buildImprovement(improvementType: string): void {
    if (!this.worker || !this.currentTile) {
      alert('No hay trabajador o casilla seleccionada');
      return;
    }
    const tileImprovementService = this.injector.get(TileImprovementService);
    const tile = this.currentTile;
    const improvement = improvementType.replace('build_', '');
    // Si es una mejora de terreno válida
    if ({
      'farm': true, 'gold_mine': true, 'road': true, 'port': true,
    }[improvement]) {
      // Verificar si se puede construir
      alert('CurrentAction: ' + improvement);
      if (tileImprovementService.canBuildImprovement(improvement as any, tile)) {
        this.worker.currentAction = ('build_' + improvement) as UnitAction;
        this.worker.buildingImprovement = improvement;
        this.worker.turnsToComplete = tileImprovementService.getImprovementTime(improvement as any) || 3;
        this.worker.movementPoints = 0;

        let building: Building | undefined;

        if (this.worker.currentAction === 'build_road') {
          this.currentTile.building = 'road';
          building = BUILDING_TEMPLATES.find((b: Building) => b.type === BuildingType.ROAD);
        } else if (this.worker.currentAction.startsWith('build_farm')) {
          this.currentTile.building = 'farm';
          building = BUILDING_TEMPLATES.find((b: Building) => b.type === BuildingType.FARM);
        }
        else if (this.worker.currentAction.startsWith('build_mine')) {
          this.currentTile.building = 'gold_mine';
          building = BUILDING_TEMPLATES.find((b: Building) => b.type === BuildingType.GOLD_MINE);

        } else if (this.worker.currentAction === 'build_port') {
          this.currentTile.building = 'port';
          building = BUILDING_TEMPLATES.find((b: Building) => b.type === BuildingType.PORT);
        }

        if (building && this.gameService.currentGame) {
          building.position.x = this.currentTile.x;
          building.position.y = this.currentTile.y;

          this.gameService.currentGame.Buildings.push(building);
        }
        alert('Construyendo ' + this.currentTile.building);
        alert('Creado: ' + (building ? JSON.stringify(building) : 'undefined'));

        this.actionSelected.emit(('build_' + improvement) as UnitAction);
        setTimeout(() => this.updateAvailableActions(), 100);
      } else {
        alert('No se puede construir esta mejora aquí.');
      }
    } else if (improvementType.startsWith('clear_')) {
      // Lógica para limpiar características
      if (tileImprovementService.canRemoveFeature(tile)) {
        this.worker.currentAction = improvementType as UnitAction;
        this.worker.turnsToComplete = improvementType === 'clear_forest' ? 3 : 4;
        this.worker.movementPoints = 0;
        alert('Eliminando característica: ' + improvementType);
        this.actionSelected.emit(improvementType as UnitAction);
        setTimeout(() => this.updateAvailableActions(), 100);
      } else {
        alert('No se puede eliminar la característica de esta casilla.');
      }
    } else {
      alert('Acción no soportada: ' + improvementType);
    }
  }

  // Cancelar la acción actual
  cancel(): void {
    this.cancelAction.emit();
  }

  // Obtener una descripción legible de la acción
  getActionDescription(action: string): string {
    const improvementName = action.replace('build_', '');
    const improvement = (BUILDING_TEMPLATES as Building[]).find((b: Building) => b.type === improvementName);
    if (improvement) {
      return `${improvement.name} (${improvement.turnsToBuild} turnos)`;
    } else if (action === 'clear_forest') {
      return "Talar bosque (3 turnos): Elimina el bosque para permitir otras mejoras.";
    } else if (action === 'clear_jungle') {
      return "Despejar jungla (4 turnos): Elimina la jungla para permitir otras mejoras.";
    } else if (action === 'build_road') {
      return "Construir camino (3 turnos): Reduce el costo de movimiento en esta casilla.";
    }
    return action;
  }

  // Comprobar si el trabajador está ocupado actualmente
  isWorkerBusy(): boolean {
    return !!(this.worker?.currentAction && this.worker?.turnsToComplete !== undefined && this.worker?.turnsToComplete > 0);
  }

  // Obtener descripción del trabajo actual
  getCurrentWorkDescription(): string {
    if (!this.worker?.currentAction) {
      return '';
    }
    if (this.worker.buildingImprovement) {
      const improvement = (BUILDING_TEMPLATES).find((b: Building) => b.type === this.worker!.buildingImprovement);
      if (improvement) {
        return `Construyendo ${improvement.name} - ${this.worker.turnsToComplete} turnos restantes`;
      }
    }
    if (this.worker.currentAction.startsWith('clear_')) {
      const featureType = this.worker.currentAction.replace('clear_', '');
      return `Despejando ${featureType} - ${this.worker.turnsToComplete} turnos restantes`;
    } else if (this.worker.currentAction === 'build_road') {
      return `Construyendo camino - ${this.worker.turnsToComplete} turnos restantes`;
    }
    return this.getActionDescription(this.worker.currentAction);
  }

  // Calcular el porcentaje de progreso
  getProgressPercentage(): number {
    if (!(this.worker?.currentAction) || this.worker?.turnsToComplete === undefined) {
      return 0;
    }
    let totalTurns = 0;
    if (this.worker.buildingImprovement) {
      const improvement = (BUILDING_TEMPLATES).find((b: Building) => b.type === this.worker!.buildingImprovement);
      if (improvement) {
        totalTurns = improvement.turnsToBuild;
      }
    } else if (this.worker.currentAction === 'build_road') {
      totalTurns = 1;
    } else if (this.worker.currentAction.startsWith('build_farm')) {
      totalTurns = 3;
    }
    else if (this.worker.currentAction.startsWith('build_mine')) {
      totalTurns = 5;
    } else if (this.worker.currentAction === 'build_port') {
      totalTurns = 8;
    }
    if (totalTurns === 0) return 0;
    const turnsCompleted = totalTurns - this.worker.turnsToComplete;
    return (turnsCompleted / totalTurns) * 100;
  }
}
