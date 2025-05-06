export interface MapCoordinate {
  x: number;
  y: number;
}

export interface MapTile {
  id: string;
  x: number;
  y: number;
  terrain: TerrainType;
  featureType?: FeatureType;
  resource?: ResourceType;
  movementCost: number;
  defense: number;
  isVisible: boolean;
  isExplored: boolean;
  yields: {
    food: number;
    production: number;
    gold: number;
  };
  hasCityOnTile?: boolean;  // Indica si hay una ciudad en esta casilla
  cityId?: string;          // ID de la ciudad en esta casilla, si existe
}

export interface TileYield {
  food: number;
  production: number;
  gold: number;
  science?: number;
  culture?: number;
}

export type TerrainType = 'plains' | 'grassland' | 'desert' | 'snow' | 'rocky' | 'water' | 'waterocean';
export type FeatureType = 'forest' | 'jungle' | 'marsh' | 'oasis' | 'ice' | 'floodplains' | 'none';
export type ResourceType =
  | 'horses' | 'iron' | 'coal' | 'oil' | 'aluminum' | 'uranium' // estratégicos
  | 'wheat' | 'cattle' | 'sheep' | 'bananas' | 'deer' | 'fish' // alimentos
  | 'gold' | 'silver' | 'gems' | 'marble' | 'ivory' | 'silk' | 'spices'; // lujo

export type ImprovementType = 'farm' | 'mine' | 'plantation' | 'camp' | 'pasture' | 'fishing_boats' | 'none';

export interface GameMap {
  width: number;
  height: number;
  tiles: MapTile[][];
}
