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

  getTileClasses(): any {
    // Si no está explorado, solo mostrar como inexplorado
    if (!this.tile.isExplored) {
      return { 'unexplored': true };
    }

    const classes: any = {
      [this.tile.terrain]: true,
      'selected': this.isUnitSelected,
      'path-tile': this.isPathTile,
      'has-unit': this.hasUnit,
      'unit-can-move': this.unitCanMove && !this.isUnitSelected
    };

    // Si hay una característica de terreno, mostrarla en lugar del terreno base
    if (this.tile.featureType && this.tile.featureType !== 'none') {
      classes[this.tile.featureType] = true;
      // Quitar la clase del terreno base si hay una característica
      delete classes[this.tile.terrain];
    }

    return classes; }
  isStrategicResource(resource: string): boolean {
    // Añade aquí los nombres de tus recursos estratégicos
    return ['iron', 'horses', 'coal', 'oil', 'aluminum', 'uranium'].includes(resource);
  }

  isFoodResource(resource: string): boolean {
    // Añade aquí los nombres de tus recursos de alimento
    return ['wheat', 'rice', 'cattle', 'fish', 'sheep'].includes(resource);
  }

  isLuxuryResource(resource: string): boolean {
    // Añade aquí los nombres de tus recursos de lujo
    return ['gold', 'silver', 'gems', 'spices', 'silk'].includes(resource);
  }
}
