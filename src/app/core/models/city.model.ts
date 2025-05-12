export enum BuildingCategory {
  FOOD = 'food',
  PRODUCTION = 'production',
  GOLD = 'gold',
  SCIENCE = 'science',
  CULTURE = 'culture',
  MILITARY = 'military'
}

export enum Era {
  ANCIENT = 'ancient',
  CLASSICAL = 'classical',
  MEDIEVAL = 'medieval',
  RENAISSANCE = 'renaissance',
  INDUSTRIAL = 'industrial',
  MODERN = 'modern'
}

export interface Building {
  id: string;
  name: string;
  category: BuildingCategory;
  level: number;
  maxLevel: number;
  era: Era;
  cost: number; 
  upgradeCost: number;
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
  description: string;
  icon: string;
}

export interface CityProduction {
  id: string;
  name: string;
  type: 'unit' | 'wonder';
  cost: number;
  progress: number;
  turnsLeft: number;
}

// Añadir interfaz para producción de edificios
export interface BuildingProduction {
  buildingId: string;
  name: string;
  cost: number;
  progress: number;
  turnsLeft: number;
  isUpgrade: boolean;
}

export interface CityBuilding extends Building {
  constructionTurn: number;
  currentLevel: number;
  isUpgrading: boolean;
  upgradeProgress?: number;
}

export interface City {
  id: string;
  name: string;
  ownerId: string;
  position: {
    x: number;
    y: number;
  };
  
  // Población y crecimiento
  population: number;
  maxPopulation: number;
  populationGrowth: number;
  citizens: {
    unemployed: number;
    farmers: number;
    workers: number;
    merchants: number;
    scientists: number;
    artists: number;
  };
  
  // Recursos
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
  
  // Era actual de la ciudad
  era: Era;

  // Cola de producción de unidades
  currentProduction?: CityProduction;
  productionQueue?: CityProduction[];
  
  // Cola de producción específica para edificios
  buildingProductionQueue?: BuildingProduction[];

  // Edificios construidos (ahora con información detallada)
  buildings: CityBuilding[];

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

  // Nivel de la ciudad
  level: string; // Nivel de la ciudad, p.ej., "asentamiento", "aldea", etc.
}
