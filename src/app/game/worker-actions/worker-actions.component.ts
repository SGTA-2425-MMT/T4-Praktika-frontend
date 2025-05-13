import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TileImprovementService, TileImprovement } from '../../core/services/tile-improvement.service';
import { MapTile } from '../../core/models/map.model';
import { Unit, UnitAction } from '../../core/models/unit.model';

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
  
  availableImprovements: TileImprovement[] = [];
  canRemoveFeature: boolean = false;
  canBuildRoad: boolean = true; // Simplificado por ahora

  constructor(private improvementService: TileImprovementService) {}

  ngOnChanges(): void {
    this.updateAvailableActions();
  }

  updateAvailableActions(): void {
    if (!this.worker || !this.currentTile) {
      this.availableImprovements = [];
      this.canRemoveFeature = false;
      return;
    }

    // Solo mostrar mejoras si el trabajador puede construirlas en esta casilla
    this.availableImprovements = this.improvementService.getValidImprovements(this.currentTile);
    
    // Comprobar si se puede eliminar alguna característica
    this.canRemoveFeature = this.improvementService.canRemoveFeature(this.currentTile);
  }

  // Seleccionar construir una mejora
  buildImprovement(improvementType: string): void {
    const actionType = 'build_' + improvementType as UnitAction;
    this.actionSelected.emit(actionType);
  }

  // Seleccionar eliminar una característica
  clearFeature(featureType: string): void {
    const actionType = 'clear_' + featureType.toLowerCase() as UnitAction;
    this.actionSelected.emit(actionType);
  }

  // Construir camino
  buildRoad(): void {
    this.actionSelected.emit('build_road');
  }

  // Cancelar la acción actual
  cancel(): void {
    this.cancelAction.emit();
  }

  // Obtener una descripción legible de la acción
  getActionDescription(action: string): string {
    const improvementName = action.replace('build_', '');
    const improvement = this.improvementService.getImprovementInfo(improvementName as any);
    
    if (improvement) {
      return `${improvement.name} (${improvement.turnsToComplete} turnos): ${improvement.description}`;
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
    return !!(this.worker && this.worker.currentAction && this.worker.turnsToComplete !== undefined && this.worker.turnsToComplete > 0);
  }

  // Obtener descripción del trabajo actual
  getCurrentWorkDescription(): string {
    if (!this.worker || !this.worker.currentAction) {
      return '';
    }
    
    if (this.worker.buildingImprovement) {
      const improvement = this.improvementService.getImprovementInfo(this.worker.buildingImprovement as any);
      if (improvement) {
        return `Construyendo ${improvement.name} - ${this.worker.turnsToComplete} turnos restantes`;
      }
    }
    
    // Para acciones que no son mejoras (como limpiar terreno o caminos)
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
    if (!this.worker || !this.worker.currentAction || this.worker.turnsToComplete === undefined) {
      return 0;
    }
    
    let totalTurns = 0;
    
    // Determinar el número total de turnos según la acción
    if (this.worker.buildingImprovement) {
      const improvement = this.improvementService.getImprovementInfo(this.worker.buildingImprovement as any);
      if (improvement) {
        totalTurns = improvement.turnsToComplete;
      }
    } else if (this.worker.currentAction === 'build_road') {
      totalTurns = 3;
    } else if (this.worker.currentAction === 'clear_forest') {
      totalTurns = 3;
    } else if (this.worker.currentAction === 'clear_jungle') {
      totalTurns = 4;
    }
    
    if (totalTurns === 0) return 0;
    
    // Invertir el porcentaje para que muestre cuánto se ha completado
    const turnsCompleted = totalTurns - this.worker.turnsToComplete;
    return (turnsCompleted / totalTurns) * 100;
  }
}
