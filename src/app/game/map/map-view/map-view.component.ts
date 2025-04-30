import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener } from '@angular/core';
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
export class MapViewComponent implements OnInit, OnChanges, AfterViewInit {
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

  ngAfterViewInit(): void {
    // Asegurarse de que el contenedor del mapa puede recibir el foco
    if (this.mapContainer && this.mapContainer.nativeElement) {
      this.mapContainer.nativeElement.focus();
    }
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

    // Si no hay unidad seleccionada o si se hace clic en otra casilla con unidad
    const unitOnTile = this.findUnitAt(tile.x, tile.y);
    
    if (unitOnTile && unitOnTile.owner === this.gameSession.currentPlayerId) {
      // Si hay una unidad del jugador actual en esta casilla, seleccionarla
      this.selectUnit(unitOnTile);
      this.highlightedTile = tile; // Mantenemos el seguimiento interno
    } else if (this.selectedUnit) {
      // Si ya hay una unidad seleccionada pero se hace clic en otra casilla
      // sin unidad o con unidad enemiga, no hacer nada (el movimiento es con flechas)
    } else {
      // Si no hay unidad seleccionada y se hace clic en una casilla
      // sin unidad, limpiar la selección
      this.clearSelection();
      this.highlightedTile = null;
    }
  }

  // Mueve la unidad seleccionada a una casilla
  moveSelectedUnit(targetTile: MapTile): void {
    if (!this.selectedUnit || !this.gameSession) return;

    // Si la unidad ya está en esta casilla, no hacer nada
    if (this.selectedUnit.position.x === targetTile.x &&
        this.selectedUnit.position.y === targetTile.y) {
      return;
    }

    // Guardar la posición original antes del movimiento
    const originalX = this.selectedUnit.position.x;
    const originalY = this.selectedUnit.position.y;

    const success = this.movementService.moveUnit(
      this.selectedUnit,
      { x: targetTile.x, y: targetTile.y },
      this.gameSession.map,
      (unit) => this.updateUnitVisibility(unit)
    );

    if (success) {
      // Actualizar el resaltado para seguir a la unidad
      this.highlightedTile = targetTile;
      
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
    this.highlightedTile = null;
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

  // Verifica si hay una unidad en las coordenadas dadas
  hasUnitAt(x: number, y: number): boolean {
    if (!this.gameSession) return false;
    
    return this.gameSession.units.some(unit => 
      unit.position.x === x && 
      unit.position.y === y
    );
  }

  // Verifica si hay una unidad que se puede mover en las coordenadas dadas
  canUnitAtTileMove(x: number, y: number): boolean {
    if (!this.gameSession) return false;
    
    const unit = this.gameSession.units.find(unit => 
      unit.position.x === x && 
      unit.position.y === y
    );
    
    return !!unit && unit.owner === this.gameSession.currentPlayerId && unit.movementPoints > 0;
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

  // Maneja las teclas de dirección
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.selectedUnit || !this.gameSession) {
      return;
    }

    // Si la unidad no tiene puntos de movimiento, no hacer nada
    if (this.selectedUnit.movementPoints <= 0) {
      return;
    }

    let targetX = this.selectedUnit.position.x;
    let targetY = this.selectedUnit.position.y;

    // Determinar dirección según tecla pulsada
    switch (event.key) {
      case 'ArrowUp':
        targetY--;
        break;
      case 'ArrowDown':
        targetY++;
        break;
      case 'ArrowLeft':
        targetX--;
        break;
      case 'ArrowRight':
        targetX++;
        break;
      default:
        return;
    }

    // Comprobar si las coordenadas están dentro de los límites del mapa
    if (targetX < 0 || targetX >= this.gameSession.map.width || 
        targetY < 0 || targetY >= this.gameSession.map.height) {
      return;
    }

    // Obtener la casilla destino
    const targetTile = this.gameSession.map.tiles[targetY][targetX];
    
    // Intentar mover la unidad
    this.moveSelectedUnit(targetTile);
    
    // Evitar que el evento se propague (evitar scroll)
    event.preventDefault();
  }

  // Terminar el turno
  finishTurn(): void {
    this.endTurn.emit();
    this.clearSelection();
  }
}
