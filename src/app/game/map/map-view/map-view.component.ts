import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovementService } from '../../../core/services/movement.service';
import { FogOfWarService } from '../../../core/services/fog-of-war.service';
import { GameService } from '../../../core/services/game.service';
import { WarService } from '../../../core/services/war.service';
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
  @Input() canManageUnits: boolean = false; // Corrected initialization
  @Input() currentPhase: string = '';

  selectedUnit: Unit | null = null;
  highlightedTile: MapTile | null = null;
  currentPath: MapCoordinate[] = [];
  showFoundCityDialog = false;
  cityName = '';
  selectedCity: City | null = null;
  movableTiles: { x: number, y: number }[] = [];
  attackMode: boolean = false; // New property to track attack mode
  attackableTiles: { x: number, y: number }[] = []; // Tiles with units that can be attacked

  constructor(
    private movementService: MovementService,
    private fogOfWarService: FogOfWarService,
    private gameService: GameService,
    private warService: WarService // Inject WarService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en la ruta actual
    this.movementService.currentPath$.subscribe(path => {
      this.currentPath = path;
    });

    // Subscribe to attack events for visualization
    this.warService.unitAttackEvent.subscribe(({ attacker, defender, damage }) => {
      this.visualizeUnitAttack(attacker, defender, damage);
    });

    this.warService.cityAttackEvent.subscribe(({ attacker, city, damage }) => {
      this.visualizeCityAttack(attacker, city, damage);
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
    if (this.attackMode) {
      this.handleAttackTileClick(tile);
    } else {
      if (!this.gameSession || !tile.isExplored) {
        return;
      }
      // Comprobar si hay una ciudad en la casilla
      if (tile.city?.id && this.gameSession.currentPhase === 'creacion_investigacion') {
        const cityOnTile = this.findCityAt(tile.x, tile.y);
        if (cityOnTile && cityOnTile.ownerId === this.gameSession.currentPlayerId) {
          this.selectedCity = cityOnTile;
          return;
        }
      }

      // Si no hay una ciudad del jugador, continuar con la lógica de unidades
      const unitOnTile = this.findUnitAt(tile.x, tile.y);

      if (unitOnTile && unitOnTile.owner === this.gameSession.currentPlayerId) {
        // Si hay una unidad del jugador actual en esta casilla, seleccionarla
        this.selectUnit(unitOnTile);
        this.highlightedTile = tile; // Mantenemos el seguimiento interno
      } else if (this.selectedUnit && this.isTileMovable(tile.x, tile.y)) {
        // Si hay una unidad seleccionada y el usuario hace clic en una casilla a la que se puede mover
        this.moveSelectedUnit(tile);
      }
      // Ya no limpiamos la selección si se hace clic en un espacio vacío
      // Esto permite que la barra lateral permanezca visible
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
    if (!this.selectedUnit || !this.gameSession || this.gameSession.currentPhase != "movimiento_accion") return;

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
    this.disableAttackMode();
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
    console.log('Intentando fundar ciudad...');
    if (!this.selectedUnit || !this.gameSession) {
      console.error('No hay unidad seleccionada o sesión de juego');
      return;
    }

    console.log(`Unidad seleccionada: ${this.selectedUnit.type} en posición (${this.selectedUnit.position.x}, ${this.selectedUnit.position.y})`);
  // Para depuración: verificar si el botón está llamando a esta función
    alert('Función foundCity() llamada');

    // Mostrar el diálogo para nombrar la ciudad
    this.showFoundCityDialog = true;
  }

  // Confirmar la fundación de la ciudad con el nombre elegido
  confirmFoundCity(): void {
    console.log('Confirmando fundación de ciudad...');
    if (!this.selectedUnit || !this.gameSession || !this.cityName) {
      console.error('Datos insuficientes para fundar ciudad:', {
        selectedUnit: !!this.selectedUnit,
        gameSession: !!this.gameSession,
        cityName: this.cityName
      });
      this.showFoundCityDialog = false;
      return;
    }

    // Llamar al servicio para fundar la ciudad
    console.log(`Llamando a gameService.foundCity con nombre: ${this.cityName}`);
    const newCity = this.gameService.foundCity(this.selectedUnit, this.cityName);

    if (newCity) {
      // La ciudad fue fundada exitosamente
      console.log(`Ciudad ${this.cityName} fundada en (${newCity.position.x}, ${newCity.position.y})`);

      // Verificar el estado del tile para asegurar que se actualizó correctamente
      const cityTile = this.gameSession.map.tiles[newCity.position.y][newCity.position.x];
      console.log('Estado del tile después de fundar ciudad:', {
        hasCityOnTile: cityTile.city.id !== undefined,
        cityId: cityTile.city.id
      });

      // Limpiar selección y resetear estados
      this.clearSelection();
      this.cityName = '';
    } else {
      console.error('Error al fundar la ciudad');
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
        cost = 0;
        break;
      case 'archer':
        cost = 0;
        break;
      case 'horseman':
        cost = 0;
        break;
      case 'swordsman':
        cost = 0;
        break;
      case 'catapult':
        cost = 0;
        break;
      case 'galley':
        cost = 0;
        break;
      case 'warship':
        cost = 0;
        break;
      case 'scout':
        cost = 0;
        break;
      case 'settler':
        cost = 0;
        break;
      case 'worker':
        cost = 0;
        break;
      default:
        cost = 0;
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
    console.log(`Intentando realizar acción: ${action}`);
    if (!this.selectedUnit || !this.gameSession) {
      console.error('No hay unidad seleccionada o sesión de juego');
      return;
    }

    if (!this.canManageUnits) {
      console.error('No se pueden gestionar unidades en esta fase');
      return;
    }

    switch(action) {
      case 'found_city':
        console.log('Llamando a foundCity() desde performUnitAction');
        this.foundCity();
        break;
      case 'build':
        this.buildImprovement();
        break;
      case 'attack':
        this.enableAttackMode();
        break;
      case 'negotiate':
        // Aquí iría la lógica para negociar
        console.log('Negociando...');
        break;
      default:
        console.error(`Acción desconocida: ${action}`);
    }
  }

  // Método para construir una mejora de terreno con un trabajador
  buildImprovement(): void {
    if (!this.selectedUnit || !this.gameSession || this.selectedUnit.type !== 'worker') {
      return;
    }

    // Aquí mostraríamos un menú para elegir qué mejora construir
    // Por ahora, simplemente fingimos que construye algo genérico
    this.selectedUnit.currentAction = 'build';
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
      case 'found_city': return 'Fundando ciudad';
      case 'negotiate': return 'Negociando';
      case 'retreat': return 'Retirándose';
      case 'build': return 'Construyendo';
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

  // Helper for template: is this tile attackable?
  isTileAttackable(x: number, y: number): boolean {
    return this.attackableTiles.some(t => t.x === x && t.y === y);
  }

  getUnitCssClassAt(x: number, y: number): string {
    const unit = this.findUnitAt(x, y);
    if (!unit) return '';
    if (unit.type === 'settler') return 'settler';
    return '';
  }

  // Visualize unit attack
  private visualizeUnitAttack(attacker: Unit, defender: Unit, damage: number): void {
    console.log(`Visualizing attack: ${attacker.name} -> ${defender.name}, Damage: ${damage}`);
    // Add visualization logic here (e.g., animations, effects)
  }

  // Visualize city attack
  private visualizeCityAttack(attacker: Unit, city: City, damage: number): void {
    console.log(`Visualizing attack: ${attacker.name} -> ${city.name}, Damage: ${damage}`);
    // Add visualization logic here (e.g., animations, effects)
  }

  // Enable attack mode for the selected unit
  enableAttackMode(): void {
    if (!this.selectedUnit || !this.gameSession) return;

    this.attackMode = true;
    this.attackableTiles = this.getAttackableTiles(this.selectedUnit);
  }

  // Disable attack mode
  disableAttackMode(): void {
    this.attackMode = false;
    this.attackableTiles = [];
  }

  // Get tiles with units that can be attacked
  getAttackableTiles(unit: Unit): { x: number, y: number }[] {
    if (!this.gameSession) return [];
    return this.gameSession.units
      .filter(u => u.id !== unit.id) // Exclude the selected unit itself
      .map(u => u.position);
  }

  // Handle tile click in attack mode
  handleAttackTileClick(tile: MapTile): void {
    if (!this.selectedUnit || !this.gameSession || !this.attackMode) return;

    const targetUnit = this.findUnitAt(tile.x, tile.y);
    if (targetUnit) {
      this.warService.attackUnit(this.selectedUnit, targetUnit);
      this.disableAttackMode(); // Exit attack mode after attacking
    }
  }
}
