// Modelo de tecnologías del juego

export enum TechEra {
  ANCIENT = 'ancient',
  MEDIEVAL = 'medieval',
  AGE_OF_DISCOVERY = 'age_of_discovery',
  MODERN = 'modern'
}

export enum TechCategory {
  AGRICULTURE = 'agriculture',
  WARFARE = 'warfare',
  ECONOMY = 'economy',
  SCIENCE = 'science',
  CULTURE = 'culture',
  EXPANSION = 'expansion',
  PRODUCTION = 'production'
}

export interface Technology {
  id: string;
  name: string;
  era: TechEra;
  category: TechCategory;
  cost: number;
  description: string;
  effects: string[];
  unlocksBuildings?: string[];
  unlocksUnits?: string[];
  prerequisites?: string[];
  icon: string;
}

export interface ResearchProgress {
  technologyId: string;
  name: string;
  progress: number;
  totalCost: number;
  turnsRemaining: number;
}
