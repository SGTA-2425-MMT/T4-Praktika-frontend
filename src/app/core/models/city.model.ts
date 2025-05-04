export interface City {
  id: string;
  name: string;
  ownerId: string;
  position: { x: number; y: number };
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
  turnsFounded: number; // En qué turno se fundó la ciudad
  currentProduction?: {
    id: string;
    name: string;
    type: 'building' | 'unit' | 'wonder';
    cost: number;
    progress: number;
    turnsLeft: number;
  };
}

export interface CityProduction {
  itemId: string;
  type: 'building' | 'unit' | 'wonder';
  turnsRemaining: number;
  progressAccumulated: number;
  totalCost: number;
}

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
