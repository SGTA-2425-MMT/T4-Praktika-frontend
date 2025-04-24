export type TerrainType = 'grass' | 'mountain' | 'water' | 'desert' | 'forest' | 'jungle' | 'ice';

export interface Resource {
  id: string;
  name: string;
  type: 'luxury' | 'strategic' | 'bonus';
  yields: {
    food?: number;
    production?: number;
    gold?: number;
  };
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  terrain: TerrainType;
  resource?: Resource;
  improvement?: string;
  owner?: string; // ID del jugador que controla esta casilla
  workerId?: string; // ID del trabajador en esta casilla, si lo hay
  unitIds: string[]; // IDs de unidades en esta casilla
  explored: boolean;
  yields: {
    food: number;
    production: number;
    gold: number;
    science: number;
    culture: number;
  };
}
