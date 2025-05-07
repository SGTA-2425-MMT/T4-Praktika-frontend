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
    defense?: number;
  }
  prerequisites?: {
    technology?: string;
    building?: string;
  }
}

export interface CityProduction {
  id: string;
  name: string;
  type: 'unit' | 'building' | 'wonder';
  cost: number;
  progress: number;
  turnsLeft: number;
}

export interface City {
  id: string;
  name: string;
  ownerId: string;
  position: {
    x: number;
    y: number;
  };
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
  turnsFounded: number;

  // Cola de producción
  currentProduction?: CityProduction;
  productionQueue?: CityProduction[];

  // Edificios construidos
  buildings: string[];

  // Casillas trabajadas
  workingTiles: {x: number, y: number}[];

  // Valores estratégicos
  defense: number;
  health: number;
  maxHealth: number;

  // Crecimiento cultural
  cultureBorder: number;
  cultureToExpand: number;

  // Especialistas
  specialists: {
    scientists: number;
    merchants: number;
    artists: number;
    engineers: number;
  }

  // Level of the city
  level: string; // Level of the city, e.g., "settlement", "village", etc.
}
