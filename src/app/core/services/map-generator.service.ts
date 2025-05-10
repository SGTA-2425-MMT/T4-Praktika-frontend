import { createSettler } from './../models/unit.model';
import { Injectable } from '@angular/core';
import { GameMap, MapTile, TerrainType, ResourceType, FeatureType } from '../models/map.model';

// This import should work correctly now
import mapData from '../../../assets/models/map.json';

@Injectable({
  providedIn: 'root'
})
export class MapGeneratorService {
  constructor() {}

  generateMap(width: number, height: number, seed?: number): GameMap {
    // Establecemos una semilla para la generación aleatoria, si se proporciona
    //const randomSeed = seed || Math.floor(Math.random() * 999999);
    console.log(`Generando mapa con semilla.`);
    console.log('mapData:', mapData);
    console.log('mapData.map existe?', !!mapData?.map);
    console.log('mapData.mapSize existe?', !!mapData?.mapSize);

    // Inicializamos un array bidimensional para el mapa (estructura de cuadrados)
    const tiles: MapTile[][] = [];

    height = mapData.mapSize.height; // Asignar altura del mapa desde el JSON
    width = mapData.mapSize.width; // Asignar ancho del mapa desde el JSON


    // Generar terreno base en estructura de cuadrados
    for (let y = 0; y < 50; y++) {
      tiles[y] = [];
      for (let x = 0; x < 50; x++) {
        if (!mapData.map[y]) {
          console.error(`Fila ${y} no existe en el mapa JSON`);
          continue;
        }

        const tileId = `tile_${x}_${y}`;
        const terrain = this.getTerrainType(mapData.map[y][x]); // Obtener el terreno del JSON
        const featureType = this.getFeatureType(mapData.featureMap[y][x]); // Obtener la característica del JSON

        tiles[y][x] = {
          id: tileId,
          x,
          y,
          terrain,
          movementCost: this.getMovementCost(terrain),
          defense: this.getDefenseBonus(terrain),
          isVisible: true,
          isExplored: true,
          yields: this.calculateBaseYield(terrain),
          city: {
            id: "0",
            name: "0",
            level: '0' // Asignar un nivel inicial
          },
          featureType // Asignar la característica al tile
        };
      }
    }


    // Añadir recursos al mapa
    this.distributeResources(tiles, width, height);

    return {
      width,
      height,
      tiles
    }; // Devolver el mapa y el settler
  }

  // Add this helper function to your MapGeneratorService class
  private getTerrainType(code: number): TerrainType {
    switch (code) {
      case 0: return 'desert';
      case 1: return 'grassland';
      case 2: return 'plains'; // Note: JSON has "plain" but type needs "plains"
      case 3: return 'rocky';
      case 4: return 'snow';
      case 5: return 'water';
      case 6: return 'waterocean';
      case 11: return 'coast_top';
      case 12: return 'coast_right';
      case 13: return 'coast_down';
      case 14: return 'coast_left';
      case 15: return 'coast15';
      case 16: return 'coast16';
      case 17: return 'coast17';
      case 18: return 'coast18';
      case 19: return 'coast19';
      case 20: return 'coast20';
      case 21: return 'coast21';
      case 22: return 'coast22';
      case 23: return 'coast23';
      case 24: return 'coast24';
      case 25: return 'coast25';
      case 26: return 'coast26';
      case 27: return 'coast27';
      case 28: return 'coast28';
      case 29: return 'coast29';
      case 30: return 'coast30';
      case 31: return 'coast31';
      case 32: return 'coast32';
      case 33: return 'coast33';
      case 34: return 'coast34';
      case 35: return 'water_ocean1';
      case 36: return 'water_ocean2';
      case 37: return 'water_ocean3';
      case 38: return 'water_ocean4';
      case 39: return 'water_ocean5';
      case 40: return 'water_ocean6';
      case 41: return 'water_ocean7';
      case 42: return 'water_ocean8';
      default:
        console.warn(`Unknown terrain code: ${code}, defaulting to 'plains'`);
        return 'plains'; // Default fallback
    }
  }

  private getFeatureType(code: number): FeatureType {
    if (code === 0) return 'none';
    if (code === 1) return 'forest';
    if (code === 2) return 'jungle';
    if (code === 3) return 'oasis';
    if (code === 4) return 'mountain';
    return 'none'; // Default fallback
  }

  private getRandomFeature(terrain: TerrainType): FeatureType | undefined {
    // No todos los terrenos pueden tener características
    if (['mountains', 'coast', 'ocean'].includes(terrain)) {
      return undefined;
    }

    // Probabilidad de tener una característica
    if (Math.random() > 0.7) {
      return undefined;
    }

    if (terrain === 'plains' || terrain === 'grassland') {
      return Math.random() > 0.5 ? 'forest' : 'jungle';
    }

    if (terrain === 'desert') {
      return Math.random() > 0.8 ? 'oasis' : undefined;
    }

    if (terrain === 'snow') {
      return Math.random() > 0.7 ? 'forest' : undefined;
    }

    return undefined;
  }

  private getMovementCost(terrain: TerrainType): number {
    const costs: Record<TerrainType, number> = {
      plains: 1,
      grassland: 1,
      desert: 1,
      snow: 1,
      water: 1,
      waterocean: 1,
      rocky: 2,
      coast_top: 1,
      coast_right: 1,
      coast_down: 1,
      coast_left: 1,
      coast15: 1, coast16: 1, coast17: 1, coast18: 1, coast19: 1,
      coast20: 1, coast21: 1, coast22: 1, coast23: 1, coast24: 1,
      coast25: 1, coast26: 1, coast27: 1, coast28: 1, coast29: 1,
      coast30: 1, coast31: 1, coast32: 1, coast33: 1, coast34: 1,
      water_ocean1: 2, water_ocean2: 2, water_ocean3: 2, water_ocean4: 2,
      water_ocean5: 2, water_ocean6: 2, water_ocean7: 2,  water_ocean8: 2
    };

    return costs[terrain] || 1;
  }

  private getDefenseBonus(terrain: TerrainType): number {
    const bonuses: Record<TerrainType, number> = {
      plains: 0,
      grassland: 0,
      desert: 0,
      snow: 0,
      water: 0,
      waterocean: 0,
      rocky: 1,
      coast_top: 1,
      coast_right: 1,
      coast_down: 1,
      coast_left: 1,
      coast15: 1, coast16: 1, coast17: 1, coast18: 1, coast19: 1,
      coast20: 1, coast21: 1, coast22: 1, coast23: 1, coast24: 1,
      coast25: 1, coast26: 1, coast27: 1, coast28: 1, coast29: 1,
      coast30: 1, coast31: 1, coast32: 1, coast33: 1, coast34: 1,
      water_ocean1: 0, water_ocean2: 0, water_ocean3: 0, water_ocean4: 0,
      water_ocean5: 0, water_ocean6: 0, water_ocean7: 0,  water_ocean8: 0
    };

    return bonuses[terrain] || 0;
  }

  private calculateBaseYield(terrain: TerrainType): { food: number; production: number; gold: number } {
    const yields: Record<TerrainType, { food: number; production: number; gold: number }> = {
      plains: { food: 1, production: 1, gold: 0 },
      grassland: { food: 2, production: 0, gold: 0 },
      desert: { food: 0, production: 0, gold: 0 },
      snow: { food: 0, production: 0, gold: 0 },
      water: { food: 1, production: 0, gold: 1 },
      waterocean: { food: 1, production: 0, gold: 1 },
      rocky: { food: 0, production: 1, gold: 0 },
      coast_top: { food: 0, production: 0, gold: 1 },
      coast_right: { food: 0, production: 0, gold: 1 },
      coast_left: { food: 0, production: 0, gold: 1 },
      coast_down: { food: 0, production: 0, gold: 1 },
      coast15: { food: 0, production: 0, gold: 1 },
      coast16: { food: 0, production: 0, gold: 1 },
      coast17: { food: 0, production: 0, gold: 1 },
      coast18: { food: 0, production: 0, gold: 1 },
      coast19: { food: 0, production: 0, gold: 1 },
      coast20: { food: 0, production: 0, gold: 1 },
      coast21: { food: 0, production: 0, gold: 1 },
      coast22: { food: 0, production: 0, gold: 1 },
      coast23: { food: 0, production: 0, gold: 1 },
      coast24: { food: 0, production: 0, gold: 1 },
      coast25: { food: 0, production: 0, gold: 1 },
      coast26: { food: 0, production: 0, gold: 1 },
      coast27: { food: 0, production: 0, gold: 1 },
      coast28: { food: 0, production: 0, gold: 1 },
      coast29: { food: 0, production: 0, gold: 1 },
      coast30: { food: 0, production: 0, gold: 1 },
      coast31: { food: 0, production: 0, gold: 1 },
      coast32: { food: 0, production: 0, gold: 1 },
      coast33: { food: 0, production: 0, gold: 1 },
      coast34: { food: 0, production: 0, gold: 1 },
      water_ocean1: { food: 0, production: 0, gold: 1 },
      water_ocean2: { food: 0, production: 0, gold: 1 },
      water_ocean3: { food: 0, production: 0, gold: 1 },
      water_ocean4: { food: 0, production: 0, gold: 1 },
      water_ocean5: { food: 0, production: 0, gold: 1 },
      water_ocean6: { food: 0, production: 0, gold: 1 },
      water_ocean7: { food: 0, production: 0, gold: 1 },
      water_ocean8: { food: 0, production: 0, gold: 1 }
    };

    return yields[terrain] || { food: 0, production: 0, gold: 0 };
  }

  private distributeResources(tiles: MapTile[][], width: number, height: number): void {

  }

  private isValidResourceLocation(terrain: TerrainType, resource: ResourceType): boolean {
    // Recursos estratégicos
    if (resource === 'horses' && ['plains', 'grassland'].includes(terrain)) return true;
    if (resource === 'iron' && ['plains', 'desert'].includes(terrain)) return true;
    if (resource === 'coal' && ['plains', 'hills'].includes(terrain)) return true;
    if (resource === 'oil' && ['water', 'desert'].includes(terrain)) return true;
    if (resource === 'aluminum' && ['plains', 'desert'].includes(terrain)) return true;

    // Recursos de alimentos
    if (resource === 'wheat' && ['plains'].includes(terrain)) return true;
    if (resource === 'cattle' && ['grassland'].includes(terrain)) return true;
    if (resource === 'sheep' && ['hills', 'plains'].includes(terrain)) return true;
    if (resource === 'bananas' && terrain === 'plains') return true;
    if (resource === 'fish' && ['water', 'waterocean'].includes(terrain)) return true;

    // Recursos de lujo
    if (resource === 'marble' && ['plains', 'desert'].includes(terrain)) return true;
    if (resource === 'ivory' && ['plains'].includes(terrain)) return true;
    if (resource === 'silk' && ['plains', 'forest'].includes(terrain)) return true;

    return false;
  }
}
