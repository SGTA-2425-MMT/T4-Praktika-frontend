import { Injectable } from '@angular/core';
import { GameMap, MapTile, TerrainType, ResourceType, FeatureType } from '../models/map.model';

@Injectable({
  providedIn: 'root'
})
export class MapGeneratorService {
  constructor() {}

  generateMap(width: number, height: number, seed?: number): GameMap {
    // Establecemos una semilla para la generación aleatoria, si se proporciona
    const randomSeed = seed || Math.floor(Math.random() * 999999);
    console.log(`Generando mapa con semilla: ${randomSeed}`);

    // Inicializamos un array bidimensional para el mapa (estructura de cuadrados)
    const tiles: MapTile[][] = [];

    // Generar terreno base en estructura de cuadrados
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        const tileId = `tile_${x}_${y}`;
        const terrain = this.getRandomTerrain();

        tiles[y][x] = {
          id: tileId,
          x,
          y,
          terrain,
          movementCost: this.getMovementCost(terrain),
          defense: this.getDefenseBonus(terrain),
          isVisible: false,
          isExplored: false,
          yields: this.calculateBaseYield(terrain),
          featureType: this.getRandomFeature(terrain)
        };
      }
    }

    // Añadir recursos al mapa
    this.distributeResources(tiles, width, height);

    return {
      width,
      height,
      tiles
    };
  }

  private getRandomTerrain(): TerrainType {
    const terrains: TerrainType[] = ['plains', 'grassland', 'desert', 'tundra', 'hills', 'mountains', 'coast', 'ocean'];
    const weights = [0.25, 0.25, 0.15, 0.1, 0.1, 0.05, 0.05, 0.05]; // Probabilidades de cada terreno

    const random = Math.random();
    let sum = 0;

    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        return terrains[i];
      }
    }

    return 'plains'; // Valor predeterminado
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

    if (terrain === 'tundra') {
      return Math.random() > 0.7 ? 'forest' : undefined;
    }

    return undefined;
  }

  private getMovementCost(terrain: TerrainType): number {
    const costs: Record<TerrainType, number> = {
      plains: 1,
      grassland: 1,
      desert: 1,
      tundra: 1,
      snow: 1,
      hills: 2,
      mountains: 999, // Intransitable
      coast: 1,
      ocean: 1
    };

    return costs[terrain] || 1;
  }

  private getDefenseBonus(terrain: TerrainType): number {
    const bonuses: Record<TerrainType, number> = {
      plains: 0,
      grassland: 0,
      desert: 0,
      tundra: 0,
      snow: 0,
      hills: 25,
      mountains: 0, // No importa ya que es intransitable
      coast: 0,
      ocean: 0
    };

    return bonuses[terrain] || 0;
  }

  private calculateBaseYield(terrain: TerrainType): { food: number; production: number; gold: number } {
    const yields: Record<TerrainType, { food: number; production: number; gold: number }> = {
      plains: { food: 1, production: 1, gold: 0 },
      grassland: { food: 2, production: 0, gold: 0 },
      desert: { food: 0, production: 0, gold: 0 },
      tundra: { food: 1, production: 0, gold: 0 },
      snow: { food: 0, production: 0, gold: 0 },
      hills: { food: 0, production: 2, gold: 0 },
      mountains: { food: 0, production: 0, gold: 0 },
      coast: { food: 1, production: 0, gold: 1 },
      ocean: { food: 1, production: 0, gold: 1 }
    };

    return yields[terrain] || { food: 0, production: 0, gold: 0 };
  }

  private distributeResources(tiles: MapTile[][], width: number, height: number): void {
    const resources: ResourceType[] = [
      'horses', 'iron', 'coal', 'oil', 'aluminum',
      'wheat', 'cattle', 'sheep', 'bananas', 'deer', 'fish',
      'gold', 'silver', 'gems', 'marble', 'ivory', 'silk', 'spices'
    ];

    // Aproximadamente el 15% de las casillas tendrán recursos
    const resourceCount = Math.floor(width * height * 0.15);

    for (let i = 0; i < resourceCount; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const resourceIndex = Math.floor(Math.random() * resources.length);

      // Solo agregar recursos a casillas apropiadas
      const tile = tiles[y][x];

      if (!this.isValidResourceLocation(tile.terrain, resources[resourceIndex])) {
        continue;
      }

      tile.resource = resources[resourceIndex];

      // Aumentar rendimiento según el recurso
      if (['wheat', 'cattle', 'sheep', 'bananas', 'deer', 'fish'].includes(tile.resource)) {
        tile.yields.food += 1;
      } else if (['horses', 'iron', 'coal', 'oil', 'aluminum'].includes(tile.resource)) {
        tile.yields.production += 1;
      } else {
        tile.yields.gold += 2;
      }
    }
  }

  private isValidResourceLocation(terrain: TerrainType, resource: ResourceType): boolean {
    // Recursos estratégicos
    if (resource === 'horses' && ['plains', 'grassland'].includes(terrain)) return true;
    if (resource === 'iron' && ['plains', 'desert', 'tundra', 'hills'].includes(terrain)) return true;
    if (resource === 'coal' && ['plains', 'hills'].includes(terrain)) return true;
    if (resource === 'oil' && ['coast', 'desert'].includes(terrain)) return true;
    if (resource === 'aluminum' && ['plains', 'desert', 'tundra', 'hills'].includes(terrain)) return true;

    // Recursos de alimentos
    if (resource === 'wheat' && ['plains'].includes(terrain)) return true;
    if (resource === 'cattle' && ['grassland'].includes(terrain)) return true;
    if (resource === 'sheep' && ['hills', 'plains'].includes(terrain)) return true;
    if (resource === 'bananas' && terrain === 'plains') return true;
    if (resource === 'deer' && terrain === 'tundra') return true;
    if (resource === 'fish' && ['coast', 'ocean'].includes(terrain)) return true;

    // Recursos de lujo
    if (['gold', 'silver', 'gems'].includes(resource) && terrain === 'hills') return true;
    if (resource === 'marble' && ['plains', 'desert', 'tundra'].includes(terrain)) return true;
    if (resource === 'ivory' && ['plains'].includes(terrain)) return true;
    if (resource === 'silk' && ['plains', 'forest'].includes(terrain)) return true;
    if (resource === 'spices' && ['jungle'].includes(terrain)) return true;

    return false;
  }
}
