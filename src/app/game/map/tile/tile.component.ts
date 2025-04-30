import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapTile, ResourceType } from '../../../core/models/map.model';

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

  ngOnInit() { }

  // Checks if the resource is a strategic resource
  isStrategicResource(resource: ResourceType | undefined): boolean {
    if (!resource) return false;
    return ['horses', 'iron', 'coal', 'oil', 'aluminum', 'uranium'].includes(resource);
  }

  // Checks if the resource is a food resource
  isFoodResource(resource: ResourceType | undefined): boolean {
    if (!resource) return false;
    return ['wheat', 'cattle', 'sheep', 'bananas', 'deer', 'fish'].includes(resource);
  }

  // Checks if the resource is a luxury resource
  isLuxuryResource(resource: ResourceType | undefined): boolean {
    if (!resource) return false;
    return ['gold', 'silver', 'gems', 'marble', 'ivory', 'silk', 'spices'].includes(resource);
  }

  onClick() {
    this.tileClick.emit(this.tile);
  }

  // Determina la clase CSS dependiendo del estado de la casilla
  getTileClass(): string {
    let classes = '';

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
