import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapTile } from '../../../core/models/map.model';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrl: './tile.component.scss'
})
export class TileComponent implements OnInit {
  @Input() tile!: MapTile;
  @Input() tileSize: number = 64;
  @Input() isHighlighted: boolean = false;
  @Input() isPathTile: boolean = false;
  @Input() isUnitSelected: boolean = false;
  @Output() tileClick = new EventEmitter<MapTile>();
  
  tileImagePath: string = '';

  ngOnInit() {
    this.updateTileImage();
  }

  updateTileImage() {
    // Determinar la imagen base según el terreno
    let terrainPath = 'assets/images/tiles/';
    
    switch (this.tile.terrain) {
      case 'plains':
        terrainPath += 'plains.png';
        break;
      case 'grassland':
        terrainPath += 'grassland.png';
        break;
      case 'desert':
        terrainPath += 'desert.png';
        break;
      case 'tundra':
        terrainPath += 'tundra.png';
        break;
      case 'snow':
        terrainPath += 'snow.png';
        break;
      case 'hills':
        terrainPath += 'hills.png';
        break;
      case 'mountains':
        terrainPath += 'mountains.png';
        break;
      case 'coast':
        terrainPath += 'coast.png';
        break;
      case 'ocean':
        terrainPath += 'ocean.png';
        break;
      default:
        terrainPath += 'unknown.png';
    }
    
    this.tileImagePath = terrainPath;
  }
  
  getFeatureImagePath(): string | null {
    if (!this.tile.featureType) return null;
    
    let featurePath = 'assets/images/features/';
    
    switch (this.tile.featureType) {
      case 'forest':
        featurePath += 'forest.png';
        break;
      case 'jungle':
        featurePath += 'jungle.png';
        break;
      case 'marsh':
        featurePath += 'marsh.png';
        break;
      case 'oasis':
        featurePath += 'oasis.png';
        break;
      case 'ice':
        featurePath += 'ice.png';
        break;
      case 'floodplains':
        featurePath += 'floodplains.png';
        break;
      default:
        return null;
    }
    
    return featurePath;
  }
  
  getResourceImagePath(): string | null {
    if (!this.tile.resource) return null;
    
    let resourcePath = 'assets/images/resources/';
    return resourcePath + this.tile.resource + '.png';
  }
  
  onClick() {
    this.tileClick.emit(this.tile);
  }
  
  // Determina la clase CSS dependiendo del estado de la casilla
  getTileClass(): string {
    let classes = 'tile';
    
    if (!this.tile.isExplored) {
      classes += ' tile-unexplored';
    } else if (!this.tile.isVisible) {
      classes += ' tile-explored-not-visible';
    }
    
    if (this.isHighlighted) {
      classes += ' tile-highlighted';
    }
    
    if (this.isPathTile) {
      classes += ' tile-path';
    }
    
    if (this.isUnitSelected) {
      classes += ' tile-unit-selected';
    }
    
    return classes;
  }
}
