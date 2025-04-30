import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovementService } from '../../../core/services/movement.service';
import { FogOfWarService } from '../../../core/services/fog-of-war.service';
import { TileComponent } from '../tile/tile.component';
import { GameMap, MapTile, MapCoordinate } from '../../../core/models/map.model';
import { Unit } from '../../../core/models/unit.model';
import { GameSession } from '../../../core/services/game.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, TileComponent],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss'
})
export class MapViewComponent implements OnInit, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() gameSession: GameSession | null = null;
  @Output() endTurn = new EventEmitter<void>();

  selectedUnit: Unit | null = null;
  highlightedTile: MapTile | null = null;
  currentPath: MapCoordinate[] = [];

  constructor(
    private movementService: MovementService,
    private fogOfWarService: FogOfWarService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en la ruta actual
    this.movementService.currentPath$.subscribe(path => {
      this.currentPath = path;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gameSession'] && this.gameSession) {
      // Inicializar el mapa cuando se carga el juego
      this.updateAllUnitsVisibility();
    }
  }

  // Maneja el clic en una casilla
  onTileClick(tile: MapTile): void {
    if (!this.gameSession || !tile.isExplored) {
      return;
    }

    // Si hay una unidad seleccionada y la casilla es visible
    if (this.selectedUnit && tile.isVisible) {
      // Intentar mover la unidad seleccionada a la casilla
      if (this.selectedUnit.movementPoints > 0) {
        this.moveSelectedUnit(tile);
      } else {
        alert('Esta unidad no tiene más puntos de movimiento');
      }
    } else {
      // Seleccionar unidad si hay una en esta casilla
      const unitOnTile = this.findUnitAt(tile.x, tile.y);
      if (unitOnTile && unitOnTile.owner === this.gameSession.currentPlayerId) {
        this.selectUnit(unitOnTile);
      } else {
        this.clearSelection();
      }
    }

    // Destacar la casilla seleccionada
    this.highlightedTile = tile;
  }

  // Mueve la unidad seleccionada a una casilla
  moveSelectedUnit(targetTile: MapTile): void {
    if (!this.selectedUnit || !this.gameSession) return;

    // Si la unidad ya está en esta casilla, no hacer nada
    if (this.selectedUnit.position.x === targetTile.x &&
        this.selectedUnit.position.y === targetTile.y) {
      return;
    }

    const success = this.movementService.moveUnit(
      this.selectedUnit,
      { x: targetTile.x, y: targetTile.y },
      this.gameSession.map,
      (unit) => this.updateUnitVisibility(unit)
    );

    if (success) {
      // Actualizar la niebla de guerra después del movimiento
      this.updateAllUnitsVisibility();

      // Limpiar la ruta
      this.movementService.setCurrentPath([]);

      // Si la unidad ya no tiene movimientos, desseleccionarla
      if (this.selectedUnit.movementPoints <= 0) {
        this.clearSelection();
      }
    } else {
      alert('No se puede mover a esa casilla');
    }
  }

  // Selecciona una unidad
  selectUnit(unit: Unit): void {
    if (!this.gameSession) return;

    if (unit.owner !== this.gameSession.currentPlayerId || !unit.canMove) {
      return;
    }

    this.selectedUnit = unit;
    this.highlightedTile = this.gameSession.map.tiles[unit.position.y][unit.position.x];
  }

  // Limpia la selección actual
  clearSelection(): void {
    this.selectedUnit = null;
    this.movementService.setCurrentPath([]);
  }

  // Fortificar la unidad seleccionada
  fortifyUnit(): void {
    if (!this.selectedUnit) return;
    this.selectedUnit.isFortified = true;
    this.selectedUnit.movementPoints = 0;
    this.clearSelection();
  }

  // Esperar con la unidad seleccionada
  waitUnit(): void {
    if (!this.selectedUnit) return;
    this.selectedUnit.movementPoints = 0;
    this.clearSelection();
  }

  // Encuentra una unidad en unas coordenadas determinadas
  findUnitAt(x: number, y: number): Unit | null {
    if (!this.gameSession) return null;

    return this.gameSession.units.find(unit =>
      unit.position.x === x && unit.position.y === y
    ) || null;
  }

  // Chequea si una casilla está en la ruta calculada
  isInPath(x: number, y: number): boolean {
    return this.currentPath.some(pos => pos.x === x && pos.y === y);
  }

  // Actualiza la visibilidad para una unidad
  updateUnitVisibility(unit: Unit): void {
    if (!this.gameSession) return;

    if (unit.owner === this.gameSession.currentPlayerId) {
      this.fogOfWarService.updateVisibility(this.gameSession.map, unit, this.gameSession.currentPlayerId);
    }
  }

  // Actualiza la visibilidad para todas las unidades del jugador actual
  updateAllUnitsVisibility(): void {
    if (!this.gameSession) return;

    const playerUnits = this.gameSession.units.filter(unit =>
      unit.owner === this.gameSession?.currentPlayerId
    );

    if (playerUnits.length > 0) {
      this.fogOfWarService.updateFogOfWarForPlayer(
        this.gameSession.map,
        playerUnits,
        this.gameSession.currentPlayerId
      );
    }
  }

  // Comprueba si una casilla es visible
  isTileVisible(x: number, y: number): boolean {
    if (!this.gameSession) return false;

    const map = this.gameSession.map;
    if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
      return map.tiles[y][x].isVisible;
    }
    return false;
  }

  // Terminar el turno
  finishTurn(): void {
    this.endTurn.emit();
    this.clearSelection();
  }
}
