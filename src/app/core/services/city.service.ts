import { Injectable } from '@angular/core';
import { City } from '../models/city.model';
import { GameMap, MapTile } from '../models/map.model';
import { Unit } from '../models/unit.model';

@Injectable({
  providedIn: 'root'
})
export class CityService {
  constructor() {}

  // Función para crear una nueva ciudad a partir de un colono
  foundCity(
    name: string,
    settler: Unit,
    map: GameMap,
    currentTurn: number
  ): City {
    console.log(`CityService.foundCity: Creando ciudad "${name}" en (${settler.position.x}, ${settler.position.y})`);
    const x = settler.position.x;
    const y = settler.position.y;

    // Crear la estructura de la ciudad con todos los campos requeridos
    const city: City = {
      id: `city_${Date.now()}`,
      name: name,
      ownerId: settler.owner,
      position: { x, y },
      population: 1,
      food: 0,
      foodPerTurn: 2, // Valor inicial básico
      foodToGrow: 20, // Valor inicial básico
      production: 0,
      productionPerTurn: 1, // Valor inicial básico
      gold: 0,
      goldPerTurn: 1, // Valor inicial básico
      science: 0,
      sciencePerTurn: 1, // Valor inicial básico
      culture: 0,
      culturePerTurn: 1, // Valor inicial básico
      happiness: 0,
      turnsFounded: currentTurn,

      // Inicializar los campos requeridos que faltaban
      buildings: [],
      workingTiles: [],
      defense: 5,
      health: 100,
      maxHealth: 100,
      cultureBorder: 1,
      cultureToExpand: 30,
      specialists: {
        scientists: 0,
        merchants: 0,
        artists: 0,
        engineers: 0
      }
    };

    // Marcar la casilla como que tiene una ciudad
    if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
      console.log(`Marcando tile (${x}, ${y}) como ciudad con ID: ${city.id}`);
      const tile = map.tiles[y][x];
      tile.hasCityOnTile = true;
      tile.cityId = city.id;

      // Debug
      console.log('Tile actualizado:', tile);
    } else {
      console.error(`Coordenadas fuera de los límites del mapa: (${x}, ${y})`);
    }

    // Actualizar los rendimientos de la ciudad basados en las casillas circundantes
    this.updateCityYields(city, map);

    return city;
  }

  // Actualizar los rendimientos de la ciudad basándose en las casillas trabajadas
  updateCityYields(city: City, map: GameMap): void {
    // Por ahora, simplemente asignamos valores básicos
    // En una implementación real, calcularíamos esto basándonos en las casillas
    city.foodPerTurn = 2;
    city.productionPerTurn = 1;
    city.goldPerTurn = 1;
    city.sciencePerTurn = 1;
    city.culturePerTurn = 1;

    // En el futuro, calcularíamos los rendimientos de las casillas trabajadas:
    /*
    const workableTiles = this.getWorkableTiles(city, map);
    let food = 0, production = 0, gold = 0;

    workableTiles.forEach(tile => {
      food += tile.yields.food;
      production += tile.yields.production;
      gold += tile.yields.gold;
    });

    city.foodPerTurn = food;
    city.productionPerTurn = production;
    city.goldPerTurn = gold;
    */
  }

  // Obtener las casillas que pueden ser trabajadas por una ciudad (para implementación futura)
  getWorkableTiles(city: City, map: GameMap): MapTile[] {
    const workableTiles: MapTile[] = [];
    const radius = 2; // Radio de trabajo de la ciudad

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = city.position.x + dx;
        const y = city.position.y + dy;

        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
          workableTiles.push(map.tiles[y][x]);
        }
      }
    }

    return workableTiles;
  }
}
