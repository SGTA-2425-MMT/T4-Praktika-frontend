import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovementService } from '../../../core/services/movement.service';
import { FogOfWarService } from '../../../core/services/fog-of-war.service';
import { GameService } from '../../../core/services/game.service';
import { TileComponent } from '../tile/tile.component';
import { GameMap, MapTile, MapCoordinate } from '../../../core/models/map.model';
import { Unit, UnitAction } from '../../../core/models/unit.model';
import { GameSession } from '../../../core/services/game.service';
import { City } from '../../../core/models/city.model';
import { CityViewComponent } from '../../city/city-view/city-view.component';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, TileComponent, FormsModule, CityViewComponent],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss'
})
export class MapViewComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() gameSession: GameSession | null = null;
  @Output() endTurn = new EventEmitter<void>();
  @Input() canManageUnits: boolean = false;
  @Input() currentPhase: string = '';

  selectedUnit: Unit | null = null;
  highlightedTile: MapTile | null = null;
  currentPath: MapCoordinate[] = [];
  showFoundCityDialog = false;
  cityName = '';
  selectedCity: City | null = null;
  movableTiles: { x: number, y: number }[] = [];

  constructor(
    private movementService: MovementService,
    private fogOfWarService: FogOfWarService,
    private gameService: GameService
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
      // Centrar la cámara en la posición inicial del jugador
      if (this.gameSession) {
        const startingUnit = this.gameSession.units.find(
          u => u.owner === this.gameSession!.currentPlayerId
        );
        if (startingUnit) {
          this.centerCameraOnPosition(startingUnit.position.x, startingUnit.position.y);
        }
      }
    }
  }

  // Centra la cámara en una posición del mapa
  centerCameraOnPosition(x: number, y: number): void {
    if (!this.mapContainer || !this.mapContainer.nativeElement) return;
    // Suponiendo que cada tile tiene un tamaño fijo (por ejemplo, 48px)
    const TILE_SIZE = 48;
    const container = this.mapContainer.nativeElement as HTMLElement;
    // Centrar el scroll en la posición (x, y)
    container.scrollLeft = Math.max(0, x * TILE_SIZE - container.clientWidth / 2 + TILE_SIZE / 2);
    container.scrollTop = Math.max(0, y * TILE_SIZE - container.clientHeight / 2 + TILE_SIZE / 2);
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
    // Solo permitir seleccionar unidades en fase de acción
    if (!this.canManageUnits) {
      this.clearSelection();
      return;
    }

    // Comprobar si hay una ciudad en la casilla
    if (tile.hasCityOnTile) {
      const cityOnTile = this.findCityAt(tile.x, tile.y);
      if (cityOnTile && cityOnTile.ownerId === this.gameSession.currentPlayerId) {
        this.selectedCity = cityOnTile;
        this.clearSelection(); // Limpiar cualquier selección de unidades
        return;
      }
    }

    // Si no hay una ciudad del jugador, continuar con la lógica de unidades
    const unitOnTile = this.findUnitAt(tile.x, tile.y);

    if (unitOnTile && unitOnTile.owner === this.gameSession.currentPlayerId) {
      // Si hay una unidad del jugador actual en esta casilla, seleccionarla
      this.selectUnit(unitOnTile);
      this.highlightedTile = tile; // Mantenemos el seguimiento interno
    } else {
      // Si no hay unidad seleccionada y se hace clic en una casilla
      // sin unidad, limpiar la selección
      this.clearSelection();
      this.highlightedTile = null;
    }
  }

  // Método para cerrar la vista de la ciudad
  closeCity(): void {
    this.selectedCity = null;
  }

  // Encuentra una ciudad en unas coordenadas determinadas
  findCityAt(x: number, y: number): City | null {
    if (!this.gameSession) return null;

    return this.gameSession.cities.find(city =>
      city.position.x === x && city.position.y === y
    ) || null;
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
      this.movableTiles = [];

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
    if (!this.canManageUnits) return;

    if (unit.owner !== this.gameSession.currentPlayerId || !unit.canMove) {
      return;
    }

    this.selectedUnit = unit;
    this.highlightedTile = this.gameSession.map.tiles[unit.position.y][unit.position.x];
    this.movableTiles = this.getMovableTiles(unit);
  }

  // Limpia la selección actual
  clearSelection(): void {
    this.selectedUnit = null;
    this.highlightedTile = null;
    this.movementService.setCurrentPath([]);
    this.movableTiles = [];
  }

  // Fortificar la unidad seleccionada
  fortifyUnit(): void {
    if (!this.selectedUnit) return;
    this.selectedUnit.isFortified = true;
    this.selectedUnit.movementPoints = 0;
    this.clearSelection();
  }

  // Fundar una ciudad con la unidad seleccionada (permite cualquier tipo de unidad)
  foundCity(): void {
    if (!this.selectedUnit || !this.gameSession) {
      return;
    }

    // Mostrar el diálogo para nombrar la ciudad
    this.showFoundCityDialog = true;
  }

  // Confirmar la fundación de la ciudad con el nombre elegido
  confirmFoundCity(): void {
    if (!this.selectedUnit || !this.gameSession || !this.cityName) {
      this.showFoundCityDialog = false;
      return;
    }

    // Llamar al servicio para fundar la ciudad
    const newCity = this.gameService.foundCity(this.selectedUnit, this.cityName);

    if (newCity) {
      // La ciudad fue fundada exitosamente
      console.log(`Ciudad ${this.cityName} fundada en (${newCity.position.x}, ${newCity.position.y})`);

      // Limpiar selección y resetear estados
      this.clearSelection();
      this.cityName = '';
    }

    this.showFoundCityDialog = false;
  }

  // Cancelar la fundación de ciudad
  cancelFoundCity(): void {
    this.showFoundCityDialog = false;
    this.cityName = '';
  }

  // Verificar si la unidad seleccionada es un colono
  isSettlerSelected(): boolean {
    return !!this.selectedUnit && this.selectedUnit.type === 'settler';
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

  // Encuentra el tipo de unidad en unas coordenadas específicas
  getUnitTypeAt(x: number, y: number): string {
    if (!this.gameSession) return '';

    const unit = this.gameSession.units.find(unit =>
      unit.position.x === x && unit.position.y === y
    );

    return unit ? unit.type : '';
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

  // Actualizar el método que maneja la producción de la ciudad
  onCityProduction(productionDetails: {type: string, name: string}): void {
    if (!this.selectedCity || !this.gameSession) return;

    // Buscar la ciudad en el arreglo de ciudades del juego
    const cityIndex = this.gameSession.cities.findIndex(c => c.id === this.selectedCity!.id);
    if (cityIndex === -1) return;

    // Obtener el costo y los turnos según el tipo de unidad
    let cost = 0;

    switch (productionDetails.type) {
      case 'warrior':
        cost = 40;
        break;
      case 'archer':
        cost = 50;
        break;
      case 'horseman':
        cost = 70;
        break;
      case 'swordsman':
        cost = 75;
        break;
      case 'catapult':
        cost = 90;
        break;
      case 'galley':
        cost = 65;
        break;
      case 'warship':
        cost = 85;
        break;
      case 'scout':
        cost = 35;
        break;
      case 'settler':
        cost = 80;
        break;
      case 'worker':
        cost = 60;
        break;
      default:
        cost = 50;
    }

    // Calcular los turnos restantes basado en la producción por turno
    const turnsLeft = Math.ceil(cost / this.selectedCity.productionPerTurn);

    // Actualizar la producción actual de la ciudad
    this.gameSession.cities[cityIndex].currentProduction = {
      id: `${productionDetails.type}_${Date.now()}`,
      name: productionDetails.name,
      type: 'unit',
      cost: cost,
      progress: 0,
      turnsLeft: turnsLeft
    };

    // Actualizar la ciudad seleccionada para reflejar los cambios
    this.selectedCity = this.gameSession.cities[cityIndex];
  }

  // Verificar si la unidad puede realizar una acción específica
  canUnitPerformAction(unit: Unit, action: UnitAction): boolean {
    if (!unit || !unit.availableActions) return false;
    return unit.availableActions.includes(action);
  }

  // Realizar una acción con la unidad seleccionada
  performUnitAction(action: UnitAction): void {
    if (!this.selectedUnit || !this.gameSession) return;
    if (!this.canManageUnits) return;

    switch(action) {
      case 'found_city':
        this.foundCity();
        break;
    }
  }

  // Método para construir una mejora de terreno con un trabajador
  buildImprovement(): void {
    if (!this.selectedUnit || !this.gameSession || this.selectedUnit.type !== 'worker') {
      return;
    }

    // Aquí mostraríamos un menú para elegir qué mejora construir
    // Por ahora, simplemente fingimos que construye algo genérico
    this.selectedUnit.currentAction = 'build_improvement';
    this.selectedUnit.turnsToComplete = 3; // Por ejemplo, 3 turnos para construir
    this.selectedUnit.movementPoints = 0; // Ya no puede moverse este turno

    console.log(`El trabajador comenzó a construir una mejora en (${this.selectedUnit.position.x}, ${this.selectedUnit.position.y})`);
    this.clearSelection();
  }

  // Método para obtener el nombre legible de una acción
  getActionName(action: UnitAction): string {
    switch(action) {
      case 'move': return 'Moviéndose';
      case 'attack': return 'Atacando';
      case 'fortify': return 'Fortificado';
      case 'found_city': return 'Fundando ciudad';
      case 'build_improvement': return 'Construyendo mejora';
      default: return 'Desconocida';
    }
  }

  // Compute all tiles the unit can move to (BFS up to movementPoints)
  getMovableTiles(unit: Unit): { x: number, y: number }[] {
    if (!this.gameSession) return [];
    const map = this.gameSession.map;
    const visited = new Set<string>();
    const result: { x: number, y: number }[] = [];
    const queue: { x: number, y: number, movesLeft: number }[] = [
      { x: unit.position.x, y: unit.position.y, movesLeft: unit.movementPoints }
    ];
    const getKey = (x: number, y: number) => `${x},${y}`;

    while (queue.length > 0) {
      const { x, y, movesLeft } = queue.shift()!;
      const key = getKey(x, y);
      if (visited.has(key)) continue;
      visited.add(key);

      if (!(x === unit.position.x && y === unit.position.y)) {
        result.push({ x, y });
      }

      if (movesLeft <= 0) continue;

      // 4 directions
      for (const dir of [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }
      ]) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
        const tile = map.tiles[ny][nx];
        if (!tile.isExplored) continue;
        if (!this.movementService.canMoveTo(tile, unit)) continue;
        const cost = tile.movementCost || 1;
        if (movesLeft - cost < 0) continue;
        queue.push({ x: nx, y: ny, movesLeft: movesLeft - cost });
      }
    }
    return result;
  }

  // Helper for template: is this tile in movableTiles?
  isTileMovable(x: number, y: number): boolean {
    return this.movableTiles.some(t => t.x === x && t.y === y);
  }
}
