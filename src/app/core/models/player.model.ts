export interface Technology {
  id: string;
  name: string;
  cost: number;
  prerequisites: string[];
  researched: boolean;
  turnsToComplete?: number;
}

export interface Player {
  id: string;
  name: string;
  civilization: string;
  gold: number;
  science: number;
  culture: number;
  happiness: number;
  totalFood: number;
  totalProduction: number;
  technologies: Technology[];
  currentResearch: string | null;
  cities: string[]; // IDs de ciudades
  units: string[]; // IDs de unidades
  exploredTiles: string[]; // IDs de casillas exploradas
  visibleTiles: string[]; // IDs de casillas visibles
}
