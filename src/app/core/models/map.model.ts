export interface MapCoordinate {
  x: number;
  y: number;
}

export interface MapTile {
  id: string;
  x: number;
  y: number;
  terrain: TerrainType;
  movementCost: number;
  defense: number;
  isVisible: boolean;
  isExplored: boolean;
  resource?: ResourceType;
  improvement?: ImprovementType;
  unit?: string; // ID de la unidad en esta casilla
  yields: TileYield;
  featureType?: FeatureType;
}

export interface TileYield {
  food: number;
  production: number;
  gold: number;
  science?: number;
  culture?: number;
}

export type TerrainType = 'plains' | 'grassland' | 'desert' | 'tundra' | 'snow' | 'coast' | 'ocean' | 'mountains' | 'hills';
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
