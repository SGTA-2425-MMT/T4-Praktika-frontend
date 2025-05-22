import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapTile } from '../../../core/models/map.model';
import { GameService } from '../../../core/services/game.service';
import { TileImprovementService } from '../../../core/services/tile-improvement.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss']
})
export class TileComponent implements OnInit, OnDestroy {
  @Input() tile!: MapTile;
  @Input() isHighlighted: boolean = false;
  @Input() isPathTile: boolean = false;
  @Input() isUnitSelected: boolean = false;
  @Input() hasUnit: boolean = false;
  @Input() unitCanMove: boolean = false;
  @Input() unitType: string = '';
  @Input() unitLevel: number = 1;
  @Input() era: string = ''; // Nueva propiedad para la era de la ciudad
  @Input() isMovableTile: boolean = false; // Nueva propiedad para casillas a las que se puede mover
  @Input() isAttackable: boolean = false; // New input for attackable tiles
  @Input() direction: 'left' | 'right' | null = null; // New input for unit direction
  @Input() buildingType: string = ''; // Nueva propiedad para el tipo de edificio
  @Output() tileClick = new EventEmitter<void>();

  private tileUpdateSubscription: Subscription | null = null;

  constructor(
    private readonly gameService: GameService,
    private readonly tileImprovementService: TileImprovementService
  ) { }

  ngOnInit(): void {
    // Suscribirse a actualizaciones de casillas
    this.tileUpdateSubscription = this.gameService.tileUpdate$.subscribe(updatedTile => {
      if (updatedTile && updatedTile.x === this.tile.x && updatedTile.y === this.tile.y) {
        // Actualizar los datos de la casilla cuando cambie
        this.updateTileData(updatedTile);
      }
    });
  }

  ngOnDestroy(): void {
    // Cancelar la suscripción al destruir el componente
    if (this.tileUpdateSubscription) {
      this.tileUpdateSubscription.unsubscribe();
    }
  }

  // Método para actualizar los datos de la casilla
  updateTileData(updatedTile: MapTile): void {
    this.tile = { ...updatedTile };
  }

  // Verifica si hay construcción en progreso en esta casilla
  isConstructionInProgress(): boolean {
    if (!this.gameService.currentGame) return false;

    // Buscar un trabajador en estas coordenadas que esté construyendo algo
    const worker = this.gameService.currentGame.units.find(unit =>
      unit.type === 'worker' &&
      unit.position.x === this.tile.x &&
      unit.position.y === this.tile.y &&
      unit.currentAction &&
      unit.turnsToComplete !== undefined &&
      unit.turnsToComplete > 0
    );

    return !!worker;
  }

  // Obtiene el porcentaje de progreso de la construcción
  getConstructionProgress(): number {

    if (!this.gameService.currentGame) return 0;

    const worker = this.gameService.currentGame.units.find(unit =>
      unit.type === 'worker' &&
      unit.position.x === this.tile.x &&
      unit.position.y === this.tile.y &&
      unit.currentAction &&
      unit.turnsToComplete !== undefined &&
      unit.turnsToComplete > 0
    );

    if (!worker?.currentAction || worker.turnsToComplete === undefined) return 0;

    // Obtener el tiempo total de construcción según el tipo de mejora
    let totalTurns = 0;

    if (worker.currentAction === 'build_road') {
      totalTurns = 3;
    } else if (worker.currentAction.startsWith('build_road')) {
      totalTurns = 1;
    } else if (worker.currentAction === 'build_farm') {
      totalTurns = 3;
    } else if (worker.currentAction === 'build_mine') {
      totalTurns = 5;
    }
    else if (worker.currentAction === 'build_port') {
      totalTurns = 8;
    }

    if (totalTurns === 0) return 0;

    const turnsCompleted = totalTurns - worker.turnsToComplete;
    return (turnsCompleted / totalTurns) * 100;
  }

  onClick(): void {
    this.tileClick.emit();
  }

  // Manejar eventos de teclado
  onKeyDown(event: KeyboardEvent): void {
    // Si se presiona Enter o Espacio, actuar como si se hubiera hecho clic
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onClick();
    }
  }

  getUnitSymbol(): string {
    // Devuelve un símbolo según el tipo de unidad
    switch (this.unitType) {
      case 'settler': return 'S';
      case 'warrior': return 'W';
      case 'worker': return 'T';
      case 'archer': return 'A';
      case 'horseman': return 'H';
      case 'rifleman': return 'R';
      case 'artillery': return 'Ar';
      case 'catapult': return 'C';
      case 'galley': return 'G';
      case 'warship': return 'B';
      case 'tank': return 'T';
      default: return '•';
    }
  }

  // Método para verificar si un recurso es estratégico
  isStrategicResource(resource: string): boolean {
    const strategicResources = ['horses', 'iron', 'coal', 'oil', 'aluminum', 'uranium'];
    return strategicResources.includes(resource);
  }

  // Método para verificar si un recurso proporciona alimentos
  isFoodResource(resource: string): boolean {
    const foodResources = ['wheat', 'cattle', 'sheep', 'bananas', 'deer', 'fish'];
    return foodResources.includes(resource);
  }

  // Método para verificar si un recurso es de lujo
  isLuxuryResource(resource: string): boolean {
    const luxuryResources = ['gold', 'silver', 'gems', 'marble', 'ivory', 'silk', 'spices'];
    return luxuryResources.includes(resource);
  }

  getTileClasses(): { [key: string]: boolean } {
    // Si no está explorado, solo mostrar como inexplorado
    if (!this.tile.isVisible) {
      return { 'tile-unexplored': true };
    }

    const classes: { [key: string]: boolean } = {
      'tile': true,
      [this.tile.terrain]: true, // Aplica la clase según el tipo de terreno
      'tile-highlighted': this.tile.isVisible && this.isUnitSelected,
      'tile-path': this.isPathTile,
      'tile-with-unit': this.hasUnit && this.unitCanMove,
      'tile-unit-selected': this.isUnitSelected,
      'tile-explored-not-visible': this.tile.isVisible && !this.tile.isVisible,
      'tile-movable': this.isMovableTile, // Clase CSS para casillas a las que se puede mover
      'tile-attackable': this.isAttackable, // Add attackable class
      'settler': this.unitType === 'settler',
      'warrior': this.unitType === 'warrior',
      'worker': this.unitType === 'worker',
      'archer': this.unitType === 'archer',
      'horseman': this.unitType === 'horseman',
      'rifleman': this.unitType === 'rifleman',
      'catapult': this.unitType === 'catapult',
      'artillery': this.unitType === 'artillery',
      'galley': this.unitType === 'galley',
      'tank': this.unitType === 'tank',
      'unit-left': this.direction === 'left', // Add direction class
      'right': true,
      //'has-road': this.tile.hasRoad === true, // Clase para casillas con camino
      //'construction-in-progress': this.isConstructionInProgress(), // Casillas con construcción en progreso

      'lvl1': this.unitLevel === 1,
      'lvl2': this.unitLevel === 2,


      'build': this.buildingType === 'none', // Clase para casillas con construcción en progreso
      'road': this.buildingType === 'road', // Clase para casillas con camino
      'farm': this.buildingType === 'farm', // Clase para casillas con granja
      'mine': this.buildingType === 'gold_mine', // Clase para casillas con mina
      'port': this.buildingType === 'port', // Clase para casillas con puerto
    };

    // Si hay una mejora en el terreno, añadir la clase correspondiente
    if (this.tile.building && this.tile.building !== 'none') {
      classes['has-improvement'] = true;
      classes[`improvement-${this.tile.building}`] = true;

      // Añadir clase especial para mejoras recién construidas
      const worker = this.gameService.currentGame?.units.find(unit =>
        unit.type === 'worker' &&
        unit.position.x === this.tile.x &&
        unit.position.y === this.tile.y &&
        unit.turnsToComplete === 0 &&
        unit.currentAction?.startsWith('build_')
      );

      if (worker) {
        classes['improvement-new'] = true;
      }
    }

    // Si hay una característica de terreno, añadirla como clase (excepto 'none')
    if (this.tile.featureType && this.tile.featureType !== 'none') {
      classes[this.tile.featureType] = true;
    }
    // Añadir la clase 'city' solo si el tile tiene una ciudad válida
    if (this.tile.city && this.tile.city.id !== '0') {
      switch (this.era) {
        case 'ancient':
          classes['city_lvl1'] = true;
          break;
        case 'medieval':
          classes['city_lvl2'] = true;
          break;
        case 'age_of_discovery':
          classes['city_lvl3'] = true;
          break;
        case 'modern':
          classes['city_lvl4'] = true;
          break;
        default:
          classes['city_lvl1'] = true;
          break;
      }

    }

    classes['build'] = true;


    // Añadir clases para el tipo de edificio
    if (this.buildingType === 'none') {
      classes['build'] = true;
    }

    return classes;
  }
}
