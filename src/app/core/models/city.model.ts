export interface Building {
  id: string;
  name: string;
  cost: number;
  maintenance: number;
  effects: {
    food?: number;
    production?: number;
    gold?: number;
    science?: number;
    culture?: number;
    happiness?: number;
  };
  isBuilt: boolean;
}

export interface CityProduction {
  itemId: string;
  type: 'building' | 'unit' | 'wonder';
  turnsRemaining: number;
  progressAccumulated: number;
  totalCost: number;
}

export interface City {
  id: string;
  name: string;
  ownerId: string;
  population: number;
  food: number;
  foodPerTurn: number;
  foodToGrow: number;
  production: number;
  productionPerTurn: number;
  gold: number;
  goldPerTurn: number;
  science: number;
  sciencePerTurn: number;
  culture: number;
  culturePerTurn: number;
  happiness: number;
  buildings: Building[];
  currentProduction: CityProduction | null;
  workingTiles: string[]; // IDs de casillas trabajadas
  controlledTiles: string[]; // IDs de casillas controladas por la ciudad
  x: number;
  y: number;
}
