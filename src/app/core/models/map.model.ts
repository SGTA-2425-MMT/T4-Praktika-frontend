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
  building: ImprovementType;
  hasRoad?: boolean; // Indica si hay un camino en la casilla
  movementCost: number;
  defense: number;
  isVisible: boolean;
  isExplored: boolean;
  yields: {
    food: number;
    production: number;
    gold: number;
  };
  city: {
    id: string;
    name: string;
    level: string; // Level of the city, e.g., "settlement", "village", etc.
  };
}

export interface TileYield {
  food: number;
  production: number;
  gold: number;
  science?: number;
  culture?: number;
}

export type TerrainType = 'plains' | 'grassland' | 'desert' | 'snow' | 'rocky' | 'water' | 'waterocean' | 'snowy_rocky' | 'sandy_rocky' |
      'coast_top' | 'coast_right' | 'coast_down' | 'coast_left'| 'coast15' | 'coast16' | 'coast17' | 'coast18' |
      'coast19' | 'coast20' | 'coast21' | 'coast22' | 'coast23' | 'coast24' | 'coast25' | 'coast26' |
      'coast27' | 'coast28' | 'coast29' | 'coast30' | 'coast31' | 'coast32' | 'coast33' | 'coast34'
      | 'water_ocean1' | 'water_ocean2' | 'water_ocean3' | 'water_ocean4' | 'water_ocean5'
      | 'water_ocean6' | 'water_ocean7' | 'water_ocean8' | 'water_ocean9' | 'water_ocean10'
      | 'water_ocean11' | 'water_ocean12';
export type FeatureType = 'forest' | 'jungle' | 'oasis' |  'mountain' | 'dunes' | 'none';
export type ResourceType =
  | 'horses' | 'iron' | 'coal' | 'oil' | 'aluminum' | 'uranium' // estratégicos
  | 'wheat' | 'cattle' | 'sheep' | 'bananas' | 'deer' | 'fish' // alimentos
  | 'gold' | 'silver' | 'gems' | 'marble' | 'ivory' | 'silk' | 'spices'; // lujo

export type ImprovementType = 'farm' | 'gold_mine' | 'road' | 'port' | 'build' | 'none';

export interface GameMap {
  width: number;
  height: number;
  tiles: MapTile[][];
}
