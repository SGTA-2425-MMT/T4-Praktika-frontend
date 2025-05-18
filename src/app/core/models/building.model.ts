// Modelo de edificios y construcciones del juego

export enum BuildingType {
  PORT = 'port',
  ROAD = 'road',
  FARM = 'farm',
  GOLD_MINE = 'gold_mine',
  BUILD = 'build', // en construcción
  NONE = 'none', // sin mejora
}

export interface Building {
  id: string; // identificador único
  name: string;
  type: BuildingType;
  cityId: string; // ciudad a la que pertenece
  health: number; // vida actual
  maxHealth: number; // vida máxima
  resourceGeneration?: {
    food?: number;
    gold?: number;
  };
  canBuildShips?: boolean; // si permite crear barcos
  facilitatesMovement?: boolean; // si facilita el movimiento (ej: camino)
  turnsToBuild: number;
  built: boolean;
  unlocked: boolean;
  position: { x: number; y: number };
  icon: string; // icono unicode o emoji
  description?: string; // descripción opcional
  // Otros efectos especiales pueden añadirse aquí

}

// Ejemplo de creación de edificios
export const BUILDING_TEMPLATES: Building[] = [
  {
    id: 'port',
    name: 'Puerto',
    type: BuildingType.PORT,
    cityId: '',
    health: 100,
    maxHealth: 100,
    canBuildShips: true,
    facilitatesMovement: false,
    turnsToBuild: 8,
    built: false,
    unlocked: false,
    position: { x: 0, y: 0 },
    icon: '⚓',
    description: 'Permite construir barcos y acceder al mar.'
  },
  {
    id: 'road',
    name: 'Camino',
    type: BuildingType.ROAD,
    cityId: '',
    health: 50,
    maxHealth: 50,
    facilitatesMovement: true,
    turnsToBuild: 1,
    built: false,
    unlocked: false,
    position: { x: 0, y: 0 },
    icon: '🛣️',
    description: 'Reduce el coste de movimiento en la casilla.'
  },
  {
    id: 'farm',
    name: 'Granja',
    type: BuildingType.FARM,
    cityId: '',
    health: 60,
    maxHealth: 60,
    resourceGeneration: { food: 2 },
    turnsToBuild: 3,
    built: false,
    unlocked: false,
    position: { x: 0, y: 0 },
    icon: '🌾',
    description: 'Aumenta la producción de alimentos en llanuras y praderas.'
  },
  {
    id: 'gold_mine',
    name: 'Mina de Oro',
    type: BuildingType.GOLD_MINE,
    cityId: '',
    health: 80,
    maxHealth: 80,
    resourceGeneration: { gold: 3 },
    turnsToBuild: 5,
    built: false,
    unlocked: false,
    position: { x: 0, y: 0 },
    icon: '⛏️',
    description: 'Aumenta la producción en colinas y rocas.'
  },
];

export class BuildingUtils {
  static validTerrain(terrain: string, type: BuildingType): boolean {
    terrain = terrain.toLowerCase();
    switch (type) {
      case BuildingType.GOLD_MINE:
        return terrain.includes('rock');
      case BuildingType.FARM:
        return terrain.includes('grassland') || terrain.includes('plains');
      case BuildingType.ROAD:
        return true;
      case BuildingType.PORT:
        return terrain.includes('coast');
      default:
        return false;
    }
  }

  static validFeature(feature: string, type: BuildingType): boolean {
    // Por ahora no se puede construir nada en una feature
    return feature === 'none';
  }
}
