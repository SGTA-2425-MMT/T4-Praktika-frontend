import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapTile } from '../../../core/models/map.model';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss']
})
export class TileComponent {
  @Input() tile!: MapTile;
  @Input() isHighlighted: boolean = false;
  @Input() isPathTile: boolean = false;
  @Input() isUnitSelected: boolean = false;
  @Input() hasUnit: boolean = false;
  @Input() unitCanMove: boolean = false;
  @Input() unitType: string = '';
  @Input() isMovableTile: boolean = false; // Nueva propiedad para casillas a las que se puede mover
  @Input() isAttackable: boolean = false; // New input for attackable tiles
  @Input() direction: 'left' | 'right' | null = null; // New input for unit direction
  @Output() tileClick = new EventEmitter<void>();

  onClick(): void {
    this.tileClick.emit();
  }

  getUnitSymbol(): string {
    // Devuelve un símbolo según el tipo de unidad
    switch(this.unitType) {
      case 'settler': return 'S';
      case 'warrior': return 'W';
      case 'worker': return 'T';
      case 'archer': return 'A';
      case 'horseman': return 'H';
      case 'swordsman': return 'E';
      case 'catapult': return 'C';
      case 'galley': return 'G';
      case 'warship': return 'B';
      case 'scout': return 'X';
      default: return '•';
    }
  }

  getTileClasses(): { [key: string]: boolean } {
    // Si no está explorado, solo mostrar como inexplorado
    if (!this.tile.isExplored) {
      return { 'tile-unexplored': true };
    }

    const classes: { [key: string]: boolean } = {
      'tile': true,
      [this.tile.terrain]: true, // Aplica la clase según el tipo de terreno
      'tile-highlighted': this.tile.isVisible && this.isUnitSelected,
      'tile-path': this.isPathTile,
      'tile-with-unit': this.hasUnit && this.unitCanMove,
      'tile-unit-selected': this.isUnitSelected,
      'tile-explored-not-visible': this.tile.isExplored && !this.tile.isVisible,
      'tile-movable': this.isMovableTile, // Clase CSS para casillas a las que se puede mover
      'tile-attackable': this.isAttackable, // Add attackable class
      'settler': this.unitType === 'settler',
      'warrior': this.unitType === 'warrior',
      'worker': this.unitType === 'worker',
      'archer': this.unitType === 'archer',
      'horseman': this.unitType === 'horseman',
      'swordsman': this.unitType === 'swordsman',
      'catapult': this.unitType === 'catapult',
      'galley': this.unitType === 'galley',

      'unit-left': this.direction === 'left', // Add direction class
      'unit-right': this.direction === 'right',
    };

    // Si hay una característica de terreno, añadirla como clase (excepto 'none')
    if (this.tile.featureType && this.tile.featureType !== 'none') {
      classes[this.tile.featureType] = true;
    }

    // Añadir la clase 'city' solo si el tile tiene una ciudad válida
    if (this.tile.city && this.tile.city.id !== '0') {
      classes['city'] = true;
    }

    return classes;
  }

  isStrategicResource(resource: string): boolean {
    // Añade aquí los nombres de tus recursos estratégicos
    return ['iron', 'horses', 'coal', 'oil', 'aluminum', 'uranium'].includes(resource);
  }
}


