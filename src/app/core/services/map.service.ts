import { Injectable } from '@angular/core';
import { GameMap, MapTile, ImprovementType } from '../models/map.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  constructor() { }

  // Obtener una casilla específica del mapa
  getTileAt(map: GameMap, x: number, y: number): MapTile | null {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
      return null;
    }

    return map.tiles[y][x];
  }

  // Comprobar si unas coordenadas están dentro de los límites del mapa
  isInBounds(map: GameMap, x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < map.width && y < map.height;
  }

  // Obtener todas las casillas dentro de un radio desde un punto
  getTilesInRadius(map: GameMap, centerX: number, centerY: number, radius: number): MapTile[] {
    const tiles: MapTile[] = [];

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // Calcular la distancia Manhattan
        if (Math.abs(dx) + Math.abs(dy) <= radius) {
          const x = centerX + dx;
          const y = centerY + dy;

          if (this.isInBounds(map, x, y)) {
            tiles.push(map.tiles[y][x]);
          }
        }
      }
    }

    return tiles;
  }

  // Actualizar la visualización de las mejoras en el mapa
  updateImprovementVisuals(map: GameMap): void {
    // Aquí se podría implementar lógica para actualizar las visualizaciones de las mejoras
    console.log('Actualizando visualización de mejoras en el mapa');
  }

  /**
   * Visualiza una mejora en el mapa mediante emojis
   * @param improvement El tipo de mejora
   * @returns Emoji de visualización correspondiente a la mejora
   */
  getImprovementVisual(improvement: ImprovementType | undefined): string {
    if (!improvement || improvement === 'none') {
      return '';
    }

    const visualMap: Record<string, string> = {
      'farm': '🌾',
      'mine': '⛏️',
      'plantation': '🌴',
      'camp': '🏕️',
      'pasture': '🐄',
      'fishing_boats': '🚣'
    };

    return visualMap[improvement] || '';
  }
}
