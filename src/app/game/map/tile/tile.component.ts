import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapTile } from '../../../core/models/map.model';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-tile" 
      [ngClass]="getTileClasses()"
      (click)="onClick()">
      <!-- Coordenadas para depuración -->
      <div class="coordinates" *ngIf="tile.isExplored">{{tile.x}},{{tile.y}}</div>
      
      <!-- Indicador de ciudad -->
      <div class="city-indicator" *ngIf="tile.hasCityOnTile">🏙️</div>
      
      <!-- Indicador de unidad -->
      <div class="unit-indicator" *ngIf="hasUnit && unitType" [ngClass]="unitType">
        {{ getUnitSymbol() }}
      </div>
    </div>
  `,
  styles: [`
    .map-tile {
      width: 50px;
      height: 50px;
      border: 1px solid #777;
      margin: 1px;
      cursor: pointer;
      position: relative;
    }
    
    /* Estilos para tipos de terreno */
    .plains { background-color: #e8dca2; }
    .grassland { background-color: #a6cc8f; }
    .desert { background-color: #e3d5a8; }
    .tundra { background-color: #c4d4c8; }
    .snow { background-color: #ebeee8; }
    .hills { background-color: #b3a67d; }
    .mountains { background-color: #8a8d91; }
    .coast { background-color: #a8cce8; }
    .ocean { background-color: #5c87c5; }
    
    /* Características adicionales */
    .forest { background-color: #4e7a3c; }
    .jungle { background-color: #2d6b34; }
    .marsh { background-color: #7da082; }
    .oasis { background-color: #73be73; }
    .ice { background-color: #dbf0ff; }
    .floodplains { background-color: #c9e0a2; }

    /* Estados de la casilla */
    .selected { border: 2px solid red; }
    .path-tile { border: 2px dashed #ecd613; }
    .has-unit { position: relative; }
    .unit-can-move { border: 2px solid yellow; }
    .unexplored { background-color: #1a1a1a; }
    
    /* Indicadores de unidades */
    .unit-indicator {
      position: absolute;
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: white;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-weight: bold;
      z-index: 10;
      border: 2px solid #333;
      font-size: 14px;
    }
    
    .settler {
      background-color: #ff9900;
      color: white;
    }
    
    .warrior {
      background-color: #cc0000;
      color: white;
    }
    
    .worker {
      background-color: #3366cc;
      color: white;
    }
    
    /* Indicador de ciudad */
    .city-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      z-index: 20;
      cursor: pointer;
    }

    /* Coordenadas para depuración */
    .coordinates {
      position: absolute;
      bottom: 2px;
      right: 2px;
      font-size: 8px;
      color: white;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 1px 2px;
      border-radius: 2px;
      z-index: 5;
    }
  `]
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

    return classes;
  }
}
