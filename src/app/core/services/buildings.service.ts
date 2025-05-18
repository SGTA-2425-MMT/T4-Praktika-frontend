import { Injectable } from '@angular/core';
import { Building, BuildingType, BUILDING_TEMPLATES } from '../models/building.model';
import { GameSession } from './game.service';
import { MapTile } from '../models/map.model';
import { City } from '../models/city.model';

export { BuildingType };

@Injectable({
  providedIn: 'root'
})
export class BuildingsService {
  private buildings: Building[] = [];

  getAll(): Building[] {
    return this.buildings;
  }

  getByCity(cityId: string): Building[] {
    return this.buildings.filter(b => b.cityId === cityId);
  }

  getByPosition(x: number, y: number, gameSession: GameSession): Building | undefined {
    return gameSession.Buildings.find(b => b.position.x === x && b.position.y === y);
  }

  addBuilding(building: Building): void {
    this.buildings.push(building);
  }

  damageBuilding(buildingId: string, amount: number): void {
    const building = this.buildings.find(b => b.id === buildingId);
    if (building) {
      building.health = Math.max(0, building.health - amount);
    }
  }

  repairBuilding(buildingId: string, amount: number): void {
    const building = this.buildings.find(b => b.id === buildingId);
    if (building) {
      building.health = Math.min(building.maxHealth, building.health + amount);
    }
  }

  removeBuilding(buildingId: string): void {
    this.buildings = this.buildings.filter(b => b.id !== buildingId);
  }

  // Lógica para generación de recursos por turno
  processTurn(cityId: string): { food: number; gold: number } {
    const buildings = this.getByCity(cityId);
    let food = 0;
    let gold = 0;
    for (const b of buildings) {
      if (b.resourceGeneration) {
        food += b.resourceGeneration.food ?? 0;
        gold += b.resourceGeneration.gold ?? 0;
      }
    }
    return { food, gold };
  }

  // Lógica para comprobar si se puede construir un barco en un puerto
  canBuildShipAt(x: number, y: number, gameSession: GameSession): boolean {
    const building = this.getByPosition(x, y, gameSession);
    return !!building && building.type === BuildingType.PORT && !!building.canBuildShips && !!building.built;
  }

  // Lógica para facilitar movimiento (ejemplo: camino)
  facilitatesMovementAt(x: number, y: number, gameSession: GameSession): boolean {
    const building = this.getByPosition(x, y, gameSession);
    return !!building && !!building.facilitatesMovement && !!building.built;
  }

  /**
   * Comprueba si se puede construir un edificio en la posición indicada.
   * Devuelve { canBuild: boolean, reason?: string, nearestCity?: City }
   */
  canBuildBuilding(
    buildingType: BuildingType,
    x: number,
    y: number,
    gameSession: GameSession
  ): { canBuild: boolean; reason?: string; nearestCity?: City } {
    // 1. Buscar la ciudad más cercana a menos de 5 casillas
    let nearestCity: City | undefined;
    let minDist = 6;
    for (const city of gameSession.cities) {
      const dist = Math.abs(city.position.x - x) + Math.abs(city.position.y - y);
      if (dist <= 5 && dist < minDist) {
        minDist = dist;
        nearestCity = city;
      }
    }
    if (!nearestCity) {
      return { canBuild: false, reason: 'No hay ninguna ciudad a menos de 5 casillas.' };
    }

    // 2. Comprobar si ya hay un edificio en esa posición
    if (this.getByPosition(x, y, gameSession)) {
      return { canBuild: false, reason: 'Ya existe una construcción en esta casilla.', nearestCity };
    }

    // 3. Comprobar si el tile es válido para el tipo de construcción
    const tile: MapTile = gameSession.map.tiles[y][x];
    switch (buildingType) {
      case BuildingType.FARM:
        if (tile.terrain !== 'plains' && tile.terrain !== 'grassland') {
          return { canBuild: false, reason: 'Solo se puede construir una granja en plains o grassland.', nearestCity };
        }
        break;
      case BuildingType.GOLD_MINE:
        if (!tile.terrain.toLowerCase().includes('rock')) {
          return { canBuild: false, reason: 'Solo se puede construir una mina en un tile de roca.', nearestCity };
        }
        break;
      case BuildingType.PORT:
        if (!tile.terrain.toLowerCase().includes('coast')) {
          return { canBuild: false, reason: 'Solo se puede construir un puerto en la costa.', nearestCity };
        }
        break;
      // Los caminos pueden ir en cualquier sitio
      case BuildingType.ROAD:
        break;
      default:
        return { canBuild: false, reason: 'Tipo de construcción no soportado.', nearestCity };
    }

    // Si pasa todas las comprobaciones
    return { canBuild: true, nearestCity };
  }

  /**
   * Devuelve el tipo de edificio en una casilla, o '' si no hay, o 'process' si está en construcción
   */
  getBuildingTypeAt(x: number, y: number, gameSession: GameSession): string {
    const building = this.getByPosition(x, y, gameSession);
    if (!building) return '';
    if (!building.built) return 'build';
    return building.type;
  }



  getBuildingType(buildingType: BuildingType): Building | undefined {
    return BUILDING_TEMPLATES.find(b => b.type === buildingType);
  }
}
