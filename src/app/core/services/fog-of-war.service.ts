
import { Injectable } from '@angular/core';
import { GameMap } from '../models/map.model';
import { Unit, UnitType } from '../models/unit.model';

@Injectable({
  providedIn: 'root'
})
export class FogOfWarService {
  constructor() {}

  // Actualiza la visibilidad basada en la posición de una unidad
  updateVisibility(map: GameMap, unit: Unit, playerId: string): void {
    const { x, y } = unit.position;
    const visionRange = this.getVisionRange(unit);

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
            tile.isVisible = true;

            // En un juego real, aquí guardaríamos la información de qué jugador ha explorado la casilla
          }
        }
      }
    }
  }

  // Determinar el rango de visión según el tipo de unidad
  private getVisionRange(unit: Unit): number {
    switch(unit.type as UnitType) {
      case 'warrior':
      case 'archer':
      case 'horseman':
        return 2; // Unidades militares tienen visión estándar
      case 'settler':
      case 'worker':
        return 2; // Unidades civiles tienen visión estándar también
      default:
        return 2; // Valor por defecto
    }
  }

  // Restablece la visibilidad para calcularla de nuevo
  resetVisibility(map: GameMap): void {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.tiles[y]?.[x]) {
          //map.tiles[y][x].isVisible = false;
        }
      }
    }
  }

  // Actualiza todas las unidades para un jugador
  updateFogOfWarForPlayer(map: GameMap, units: Unit[], playerId: string): void {
    // Primero, resetear toda la visibilidad
    this.resetVisibility(map);

    // Luego actualizar la visibilidad con todas las unidades del jugador
    for (const unit of units) {
      if (unit.owner === playerId) {
        this.updateVisibility(map, unit, playerId);
      }
    }
  }

    // Revela el mapa entero para un jugador específico (función para trucos)
  revealAllMap(map: GameMap, playerId: string): void {
    console.log(`Revelando todo el mapa para el jugador ${playerId}`);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.tiles[y]?.[x]) {
          map.tiles[y][x].isVisible = true;
        }
      }
    }
  }
}
