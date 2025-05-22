import { Component, ElementRef, HostListener, Injector, Input, OnInit, Output, ViewChild, EventEmitter, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService, GameSession } from '../../../core/services/game.service';
import { WarService } from '../../../core/services/war.service';
import { TileImprovementService } from '../../../core/services/tile-improvement.service';
import { FogOfWarService } from '../../../core/services/fog-of-war.service';
import { MovementService } from '../../../core/services/movement.service';
import { MapCoordinate, MapTile } from '../../../core/models/map.model';
import { AnimationService } from '../../../core/services/animation.service';
import { Unit, UnitAction } from '../../../core/models/unit.model';
import { City } from '../../../core/models/city.model';
import { TileComponent } from '../tile/tile.component';
import { WorkerActionsComponent } from '../../worker-actions/worker-actions.component';
import { CityViewComponent } from '../../city/city-view/city-view.component';
import { BUILDING_TEMPLATES, BuildingType, Building } from '../../../core/models/building.model';
import { BuildingsService } from '../../../core/services/buildings.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, TileComponent, FormsModule, WorkerActionsComponent, CityViewComponent],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss',
  providers: [AnimationService]
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
  private readonly phaserScene!: Phaser.Scene;
  showWorkerActionsMenu = false; // New property for worker actions menu

  constructor(
    private readonly movementService: MovementService,
    private readonly fogOfWarService: FogOfWarService,
    private readonly gameService: GameService,
    private readonly animationService: AnimationService,
    private readonly warService: WarService,
    private readonly injector: Injector,
    private readonly buildingsService: BuildingsService // <--- INJECTED
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

    // Subscribirse a actualizaciones de casillas
    this.gameService.tileUpdate$.subscribe(updatedTile => {
      if (updatedTile && this.gameSession) {
        // Actualizar la casilla en el mapa
        this.updateMapTile(updatedTile);
      }
    });

    // Initialize Phaser
    this.warService.unitAttackEvent.subscribe(event => {
      this.visualizeUnitAttack(event.attacker, event.defender, event.damage);
    });
  }

  ngAfterViewInit(): void {
    // Asegurarse de que el contenedor del mapa puede recibir el foco
    if (this.mapContainer?.nativeElement) {
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
      setTimeout(() => {
        this.animationService.initPhaser(this.mapContainer?.nativeElement);
      }, 500);
  }

  // Centra la cámara en una posición del mapa
  centerCameraOnPosition(x: number, y: number): void {
    if (!this.mapContainer?.nativeElement) return;

    const TILE_SIZE = 120; // Assuming each tile is 120px
    const container = this.mapContainer.nativeElement as HTMLElement;

    // Calculate the scroll position to center the camera
    const scrollLeft = Math.max(0, x * TILE_SIZE - container.clientWidth / 2 + TILE_SIZE / 2);
    const scrollTop = Math.max(0, y * TILE_SIZE - container.clientHeight / 2 + TILE_SIZE / 2);

    // Apply the calculated scroll positions
    container.scrollTo({ left: scrollLeft, top: scrollTop, behavior: 'smooth' });
  }

  // Add a method to center the map on the position of a newly created unit
  centerOnUnitCreation(unit: Unit): void {
    if (unit?.position) {
      this.centerCameraOnPosition(unit.position.x, unit.position.y);
    }
  }

  // Call this method when a unit is created
  onUnitCreated(unit: Unit): void {
    this.centerOnUnitCreation(unit);
    // Additional logic for unit creation can be added here
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gameSession'] && this.gameSession) {
      // Inicializar el mapa cuando se carga el juego
      this.updateAllUnitsVisibility();
    }
  }

  // Maneja el clic en una casilla
  onTileClick(tile: MapTile): void {
    console.log(tile.building)
    // Si estamos en modo ataque, manejarlo
    if (this.attackMode) {
      this.handleAttackTileClick(tile);
      return;
    }

    // Si estamos mostrando el menú de trabajador y hacemos clic en otra casilla (que no sea la del trabajador)
    // cerramos el menú y continuamos con la acción normal de clic
    if (this.showWorkerActionsMenu &&
        this.selectedUnit &&
        (tile.x !== this.selectedUnit.position.x || tile.y !== this.selectedUnit.position.y)) {
      console.log('Cerrando menú de trabajador por clic en otra casilla');
      this.showWorkerActionsMenu = false;
    }

    // Si el tile no es válido o no está explorado, salir
    if (!this.gameSession || !tile.isVisible) {
      return;
    }

    // Comprobar si hay una ciudad en la casilla
    if (tile.city?.id && this.gameSession.currentPhase === 'creacion_investigacion') {
      const cityOnTile = this.findCityAt(tile.x, tile.y);
      if (cityOnTile && cityOnTile.ownerId === this.gameSession.currentPlayerId) {
        this.selectedCity = cityOnTile;
        this.clearSelection(); // Limpiar cualquier unidad seleccionada
        return;
      }
    }

    // Si no hay una ciudad del jugador, continuar con la lógica de unidades
    const unitOnTile = this.findUnitAt(tile.x, tile.y);

    if (unitOnTile && unitOnTile.owner === this.gameSession.currentPlayerId) {
      // Si ya está seleccionada esta unidad y es un trabajador, mostrar el menú de acciones
      if (this.selectedUnit && this.selectedUnit.id === unitOnTile.id && unitOnTile.type === 'worker') {
        console.log('Trabajador seleccionado, mostrando menú de acciones');
        this.showWorkerActionsMenu = true; // Directamente activar el menú
      } else {
        // Si hay una unidad del jugador actual en esta casilla, seleccionarla
        this.selectUnit(unitOnTile);
        this.highlightedTile = tile; // Mantenemos el seguimiento interno

        // Si es un trabajador, mostrar inmediatamente el menú
        if (unitOnTile.type === 'worker') {
          console.log('Nuevo trabajador seleccionado, mostrando menú de acciones');
          this.showWorkerActionsMenu = true;
        }
      }
    } else if (this.selectedUnit && this.isTileMovable(tile.x, tile.y)) {
      // Si hay una unidad seleccionada y el usuario hace clic en una casilla a la que se puede mover
      this.moveSelectedUnit(tile);
    } else {
      // Si se hace clic en una casilla vacía que no es movible, cerrar cualquier menú abierto
      this.showWorkerActionsMenu = false;
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

moveSelectedUnit(targetTile: MapTile): void {
  if (!this.selectedUnit || !this.gameSession || this.gameSession.currentPhase != "movimiento_accion") return;

  // If the unit is already on the target tile, do nothing
  if (this.selectedUnit.position.x === targetTile.x &&
      this.selectedUnit.position.y === targetTile.y) {
    return;
  }

  // Determine the direction of movement
  const direction = targetTile.x > this.selectedUnit.position.x ? 'right' : 'left';

  // Update the direction class on the current tile
  const currentTileElement = document.querySelector(`.tile[x="${this.selectedUnit.position.x}"][y="${this.selectedUnit.position.y}"]`);
  if (currentTileElement) {
    const unitIndicator = currentTileElement.querySelector('.unit-indicator');
    if (unitIndicator) {
      unitIndicator.classList.remove('left', 'right');
      unitIndicator.classList.add(direction);
    }
  }

  // Move the unit using the movement service
  const success = this.movementService.moveUnit(
    this.selectedUnit,
    { x: targetTile.x, y: targetTile.y },
    this.gameSession.map,
    (unit) => this.updateUnitVisibility(unit)
  );

  if (success) {
    // Update the highlighted tile to follow the unit
    this.highlightedTile = targetTile;

    // Update the fog of war after movement
    this.updateAllUnitsVisibility();

    // Clear the path and movable tiles
    this.movementService.setCurrentPath([]);
    this.movableTiles = [];

    // If the unit has no movement points left, deselect it
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
    // Asegurarse de que se cierra el menú de trabajador
    this.showWorkerActionsMenu = false;
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
      unit.position.x === x &&
      unit.position.y === y
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
      unit.position.x === x &&
      unit.position.y === y
    );

    return unit ? unit.type : '';
  }

  getUnitLevelAt(x: number, y: number): number {

    if (!this.gameSession) return 1;

    const unit = this.gameSession.units.find(unit =>
      unit.position.x === x &&
      unit.position.y === y
    );

    return unit ? unit.level : 1;
  }

  // Devuelve el tipo de edificio en una casilla, o '' si no hay, o 'process' si está en construcción
  getBuildingTypeAt(x: number, y: number): string {
    if (!this.gameSession) return '';
    return this.buildingsService.getBuildingTypeAt(x, y, this.gameSession);
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
      case 'catapult':
        cost = 0;
        break;
      case 'artillery':
        cost = 0;
        break;
      case 'galley':
        cost = 0;
        break;
      case 'rifleman':
        cost = 0;
        break;
      case 'warship':
        cost = 0;
        break;
      case 'tank':
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

  // Manejar la construcción de un edificio en una ciudad
  onCityBuildBuilding(buildingType: string): void {
    if (!this.selectedCity || !this.gameSession) return;

    // Buscar la posición de la ciudad seleccionada (o podrías usar otra lógica para la posición)
    const x = this.selectedCity.position.x;
    const y = this.selectedCity.position.y;

    // Usar el servicio de edificios para validar
    const result = this.buildingsService.canBuildBuilding(
      buildingType as BuildingType,
      x,
      y,
      this.gameSession
    );

    if (!result.canBuild) {
      alert(result.reason ?? 'No se puede construir aquí');
      return;
    }

    // Crear el edificio usando la plantilla
    const template = BUILDING_TEMPLATES.find((b: Building) => b.type === buildingType);
    if (!template) {
      alert('Tipo de edificio no soportado');
      return;
    }
    const newBuilding: Building = {
      ...template,
      id: template.type + '_' + Date.now(),
      cityId: result.nearestCity?.id ?? '',
      position: { x, y },
      built: false,
    };
    this.buildingsService.addBuilding(newBuilding);
  }

  // Verificar si la unidad puede realizar una acción específica
  canUnitPerformAction(unit: Unit, action: UnitAction): boolean {
    return unit?.availableActions?.includes(action) ?? false;
  }

  // Realizar una acción con la unidad seleccionada
  performUnitAction(action: UnitAction, buildingType?:BuildingType): void {
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
        const tileImprovementService = this.injector.get(TileImprovementService);
        if(!buildingType) {
          console.error('No se ha especificado un tipo de edificio');
          return;
        }
        else{
          this.buildImprovement(); // <-- Aquí se llama correctamente con el tipo de mejora recibido
        }
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
    alert('Construyendo mejora de terreno...'+this.selectedUnit?.buildingImprovement);
    if (!this.selectedUnit || !this.gameSession || this.selectedUnit.type !== 'worker') {
      console.warn('[buildImprovement] No hay unidad seleccionada, no hay sesión de juego, o la unidad no es trabajador');
    }
  }


  // Cancelar la acción actual del trabajador
  cancelWorkerAction(): void {
    console.log('Cancelando acción del trabajador...');
    if (!this.selectedUnit || this.selectedUnit.type !== 'worker') {
      console.warn('[cancelWorkerAction] No hay unidad seleccionada o la unidad no es trabajador');
      return;
    }
    this.showWorkerActionsMenu = false;
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
        if (!tile.isVisible) continue;
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

  visualizeUnitAttack(attacker: Unit, defender: Unit, damage: number): void {
    console.log(`Visualizing attack: ${attacker.name} -> ${defender.name}, Damage: ${damage}`);

    // Mostrar barra de vida si no está visible
    defender.healthBarVisible ??= true;

    // Actualizar la barra de vida
    const healthPercentage = (defender.health / defender.maxHealth) * 100;
    const healthBarElement = document.getElementById(`health-bar-${defender.id}`);
    if (healthBarElement) {
        healthBarElement.style.width = `${healthPercentage}%`;
    }

    // Lógica existente para animar el daño
    const x = defender.position.x * 120 + 60; // Center of the tile
    const y = defender.position.y * 120 + 60;
    const damageElement = document.createElement('div');
    damageElement.textContent = `-${damage}`;
    damageElement.style.position = 'absolute';
    damageElement.style.left = `${x}px`;
    damageElement.style.top = `${y}px`;
    damageElement.style.color = 'red';
    damageElement.style.fontSize = '24px';
    damageElement.style.fontWeight = 'bold';
    damageElement.style.transform = 'translate(-50%, -50%)';
    damageElement.style.zIndex = '1000';
    this.mapContainer.nativeElement.appendChild(damageElement);

    // Animar el texto de daño
    const animationDuration = 1000; // 1 segundo
    const startTime = performance.now();
    const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        damageElement.style.top = `${y - 30 * progress}px`;
        damageElement.style.opacity = `${1 - progress}`;
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            damageElement.remove(); // Eliminar el elemento después de la animación
        }
    };
    requestAnimationFrame(animate);
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

  // Método para actualizar una casilla específica en el mapa
  updateMapTile(tile: MapTile): void {
    if (!this.gameSession) return;

    // Actualizar la casilla en el mapa del juego
    this.gameSession.map.tiles[tile.y][tile.x] = { ...tile };

    // Si hay una unidad en esta casilla, puede que necesite actualizar su visualización
    const unitOnTile = this.findUnitAt(tile.x, tile.y);
    if (unitOnTile) {
      // Puede ser útil para ciertas visualizaciones relacionadas con las unidades
      console.log(`Unidad ${unitOnTile.name} (${unitOnTile.id}) en casilla actualizada (${tile.x}, ${tile.y})`);
    }
  }

  // Método para actualizar la barra de vida de una unidad
  updateHealthBar(unitId: string, healthPercentage: number): void {
    const healthBarElement = document.querySelector(`.unit-health-bar[data-unit-id="${unitId}"]`);
    if (healthBarElement) {
      (healthBarElement as HTMLElement).style.width = `${healthPercentage}%`;
    }
  }

  // Elimina un trabajador en una posición específica
  private removeWorkerAt(x: number, y: number): void {
    if (!this.gameSession) return;
    const idx = this.gameSession.units.findIndex(u => u.type === 'worker' && u.position.x === x && u.position.y === y);
    if (idx !== -1) {
      this.gameSession.units.splice(idx, 1);
    }
    // Si el trabajador eliminado estaba seleccionado, limpiar selección
    if (this.selectedUnit && this.selectedUnit.type === 'worker' && this.selectedUnit.position.x === x && this.selectedUnit.position.y === y) {
      this.clearSelection();
    }
  }

    /**
 * Método para cerrar el panel lateral
 */
closeSidebar(): void {
  console.log('Cerrando panel lateral');
  // Si hay una unidad seleccionada, la deseleccionamos
  if (this.selectedUnit) {
    this.clearSelection();
  }

  // Si hay una ciudad seleccionada, la deseleccionamos
  if (this.selectedCity) {
    this.selectedCity = null;
  }

  // Asegurarnos de que cualquier otro menú contextual también se cierre
  this.showWorkerActionsMenu = false;
}
}
