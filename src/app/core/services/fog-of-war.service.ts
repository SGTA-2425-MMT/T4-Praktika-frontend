import { Injectable } from '@angular/core';
import { GameMap, MapTile } from '../models/map.model';
import { Unit } from '../models/unit.model';

@Injectable({
  providedIn: 'root'
})
export class FogOfWarService {
  constructor() {}

  // Actualiza la visibilidad basada en la posición de una unidad
  updateVisibility(map: GameMap, unit: Unit, playerId: string): void {
    const { x, y } = unit.position;
    const visionRange = this.getUnitVisionRange(unit);

    // Visibilidad por la posición de la unidad
    for (let dy = -visionRange; dy <= visionRange; dy++) {
      for (let dx = -visionRange; dx <= visionRange; dx++) {
        const newY = y + dy;
        const newX = x + dx;

        // Verificar que esté dentro del mapa
        if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
          const tile = map.tiles[newY][newX];

          // La distancia Manhattan está dentro del rango de visión
          const distance = Math.abs(dx) + Math.abs(dy);

          if (distance <= visionRange) {
            // Marcar como explorada y visible
            tile.isExplored = true;
            tile.isVisible = true;

            // En un juego real, aquí guardaríamos la información de qué jugador ha explorado la casilla
          }
        }
      }
    }
  }

  // Devuelve el rango de visión de una unidad
  private getUnitVisionRange(unit: Unit): number {
    switch (unit.type) {
      case 'scout':
        return 3;
      case 'warrior':
      case 'archer':
      case 'swordsman':
      case 'horseman':
        return 2;
      case 'settler':
      case 'worker':
      default:
        return 2;
    }
  }

  // Restablece la visibilidad para calcularla de nuevo
  resetVisibility(map: GameMap): void {
    if (!map) {
      console.warn('Invalid map provided to resetVisibility');
      return;
    }

    // Check if tiles array exists and has the expected structure
    if (!map.tiles || !Array.isArray(map.tiles)) {
      console.warn('Map tiles structure is invalid in resetVisibility');
      return;
    }

    for (let y = 0; y < map.height && y < map.tiles.length; y++) {
      if (!map.tiles[y] || !Array.isArray(map.tiles[y])) {
        continue; // Skip invalid rows
      }

      for (let x = 0; x < map.width && x < map.tiles[y].length; x++) {
        if (map.tiles[y][x]) {
          map.tiles[y][x].isVisible = false;
        }
      }
    }
  }

  // Actualiza todas las unidades para un jugador
  updateFogOfWarForPlayer(map: GameMap, units: Unit[], playerId: string): void {
    if (!map || !units || !Array.isArray(units)) {
      console.warn('Invalid map or units data provided to updateFogOfWarForPlayer');
      return;
    }

    // Primero, resetear toda la visibilidad
    this.resetVisibility(map);

    // Luego actualizar la visibilidad con todas las unidades del jugador
    for (const unit of units) {
      if (unit && unit.owner === playerId) {
        this.updateVisibility(map, unit, playerId);
      }
    }
  }
}
