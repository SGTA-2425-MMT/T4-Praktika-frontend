import { createSettler, SettlerUnit } from './../models/unit.model';
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
          //featureType: this.getRandomFeature(terrain)
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
    if (code === 0) return 'desert';
    if (code === 1) return 'grassland';
    if (code === 2) return 'plains';  // Note: JSON has "plain" but type needs "plains"
    if (code === 3) return 'rocky';
    if (code === 4) return 'snow';
    if (code === 5) return 'water';
    if (code === 6) return 'waterocean';
    return 'plains'; // Default fallback
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
      rocky: 1
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
      rocky: { food: 0, production: 1, gold: 0 }
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
