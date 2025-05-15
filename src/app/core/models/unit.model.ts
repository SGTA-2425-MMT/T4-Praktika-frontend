export type UnitType =
  // Unidades terrestres
  'settler' | 'warrior' | 'archer' | 'horseman' | 'artillery' | 'tank' | 'rifleman' |
  // Unidades navales
  'galley' | 'warship' |
  // Unidades aéreas (opcionales)
  // Especiales
  'worker' | 'catapult' | 'cannon';

export type UnitAction = 'move' | 'attack' |'found_city' | 'build' | 'negotiate' | 'retreat' | 'navigate' |
  'build_farm' | 'build_mine' | 'build_plantation' | 'build_camp' | 'build_pasture' | 'build_fishing_boats' |
  'clear_forest' | 'clear_jungle' | 'build_road';

export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  owner: string; // ID del jugador
  position: {
    x: number;
    y: number;
  };
  movementPoints: number;
  maxMovementPoints: number;
  strength: number;
  health: number;
  maxHealth: number;
  isRanged: boolean;
  canMove: boolean;
  isFortified: boolean;
  rangedStrength?: number;
  range?: number;
  maxRange?: number;
  maxattacksPerTurn: number;
  attacksPerTurn: number;
  movementType?: 'land' | 'naval' | 'air';
  cost: number;
  level: number; // Nivel de la unidad

  // Nuevos campos para mejorar la jugabilidad
  availableActions?: UnitAction[];
  turnsToComplete?: number; // Para acciones como construir mejoras
  currentAction?: UnitAction; // Acción actual que está realizando
  buildingImprovement?: string; // El tipo de mejora que está construyendo
  targetPosition?: {x: number, y: number}; // Posición objetivo para acciones como moverse
  isAutoExploring?: boolean; // Si la unidad está en modo exploración automática
  promotions?: string[]; // Promociones/mejoras que tiene la unidad
}

// Nuevas interfaces para mejorar la jugabilidad
export interface UnitPromotion {
  id: string;
  name: string;
  description: string;
  effect: {
    strength?: number;
    movementPoints?: number;
    health?: number;
    rangedStrength?: number;
    defensiveBonus?: number;
    attackBonus?: number;
  };
  prerequisites: string[];
}

export interface TerrainEffect {
  terrainType: string;
  movementCost: number;
  defenseBonus: number;
  attackPenalty: number;
}


// Ejemplo de creación de un Settler:
export const createSettler = (owner: string, x: number, y: number, level:number): Unit => ({
  id: `settler_${Date.now()}`,
  name: 'Settler',
  type: 'settler',
  owner,
  position: { x, y },

  turnsToComplete: 0,
  cost: 0,

  movementPoints: 2,
  maxMovementPoints: 2,
  strength: 0,
  health: 100 + 10 * level,
  maxHealth: 100 + 10 * level,
  maxattacksPerTurn: 0,
  attacksPerTurn: 0,

  isRanged: false,
  availableActions: ['move', 'found_city', 'negotiate'],
  canMove: true,
  isFortified: false,
  level: level,
});

//Ejemplo de Worker
export const createWorker = (owner: string, x: number, y: number, level:number): Unit => ({
  id: `worker_${Date.now()}`,
  name: 'Worker',
  type: 'worker',
  owner,
  position: { x, y },

  turnsToComplete: 0,
  cost: 0,

  movementPoints: 2,
  maxMovementPoints: 2,
  strength: 0,
  maxHealth: 100 + 20 * level,
  health: 100 + 20 * level,

  maxattacksPerTurn: 0,
  attacksPerTurn: 0,

  isRanged: false,
  availableActions: ['move', 'build_farm', 'build_mine', 'build_plantation', 'build_camp', 'build_pasture',
                     'build_fishing_boats', 'clear_forest', 'clear_jungle', 'build_road'],
  buildingImprovement: undefined,
  canMove: true,
  isFortified: false,
  level: level,
});

// Ejemplo de creación de un Warrior:
export const createWarrior = (owner: string, x: number, y: number, level:number): Unit => ({
  id: `warrior_${Date.now()}`,
  name: 'Warrior',
  type: 'warrior',
  owner,
  position: { x, y },

  turnsToComplete: 0,
  cost: 0,

  movementPoints: 2,
  maxMovementPoints: 2,
  strength: 20 + 5 * level,
  health: 100 + 15 * level,
  maxHealth: 100 + 15 * level,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,

  isRanged: false,
  availableActions: ['move', 'attack', 'retreat'],
  canMove: true,
  isFortified: false,
  level: level,
});

// Ejemplo de creación de un Archer:
export const createArcher = (owner: string, x: number, y: number, level:number): Unit => ({
  id: `archer_${Date.now()}`,
  name: 'Archer',
  type: 'archer',
  owner,
  position: { x, y },

  turnsToComplete: 0,
  cost: 0,

  movementPoints: 2,
  maxMovementPoints: 2,
  strength: 5 + 3 * level,
  health: 100 + 10 * level,
  maxHealth: 100 + 10 * level,

  isRanged: true,
  maxRange: 2,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,

  availableActions: ['move', 'attack', 'retreat'],
  canMove: true,
  isFortified: false,
  level: level,
});

// Ejemplo de creación de un Horseman:
export const createHorseman = (owner: string, x: number, y: number, level:number): Unit => ({
  id: `horseman_${Date.now()}`,
  name: 'Horseman',
  type: 'horseman',
  owner,
  position: { x, y },

  turnsToComplete: 0,
  cost: 0,

  movementPoints: 4,
  maxMovementPoints: 4,
  strength: 8 + 4 * level,
  health: 100 + 12 * level,
  maxHealth: 100 + 12 * level,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,

  isRanged: false,
  availableActions: ['move', 'attack', 'retreat'],
  canMove: true,
  isFortified: false,
  level: level,
});

// Ejemplo de creación de un Catapult:
export const createArtillery = (owner: string, x: number, y: number, level:number): Unit => ({
  id: `artillery_${Date.now()}`,
  name: 'Artillery',
  type: 'artillery',
  owner,
  position: { x, y },

  turnsToComplete: 0,
  cost: 0,

  movementPoints: 2,
  maxMovementPoints: 2,
  strength: 6 + 2 * level,
  health: 100 + 8 * level,
  maxHealth: 100 + 8 * level,

  isRanged: true,
  maxRange: 3,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,

  availableActions: ['move', 'attack'],
  canMove: true,
  isFortified: false,
  level: level,
});

// Factory for Catapult (maps to artillery)
export const createCatapult = (owner: string, x: number, y: number, level: number): Unit => ({
  ...createArtillery(owner, x, y, level),
  id: `catapult_${Date.now()}`,
  name: 'Catapult',
  type: 'catapult',
});

// Factory for Warship
export const createWarship = (owner: string, x: number, y: number, level: number): Unit => ({
  id: `warship_${Date.now()}`,
  name: 'Warship',
  type: 'warship',
  owner,
  position: { x, y },
  turnsToComplete: 0,
  cost: 0,
  movementPoints: 5,
  maxMovementPoints: 5,
  strength: 18 + 5 * level,
  health: 120 + 15 * level,
  maxHealth: 120 + 15 * level,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,
  isRanged: false,
  movementType: 'naval',
  availableActions: ['move', 'attack', 'retreat'],
  canMove: true,
  isFortified: false,
  level: level,
});

// Factory for Cannon
export const createCannon = (owner: string, x: number, y: number, level: number): Unit => ({
  id: `cannon_${Date.now()}`,
  name: 'Cannon',
  type: 'cannon',
  owner,
  position: { x, y },
  turnsToComplete: 0,
  cost: 0,
  movementPoints: 2,
  maxMovementPoints: 2,
  strength: 14 + 4 * level,
  health: 100 + 10 * level,
  maxHealth: 100 + 10 * level,
  isRanged: true,
  maxRange: 3,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,
  availableActions: ['move', 'attack'],
  canMove: true,
  isFortified: false,
  level: level,
});

// Factory for Galley
export const createGalley = (owner: string, x: number, y: number, level: number): Unit => ({
  id: `galley_${Date.now()}`,
  name: 'Galley',
  type: 'galley',
  owner,
  position: { x, y },
  turnsToComplete: 0,
  cost: 0,
  movementPoints: 4,
  maxMovementPoints: 4,
  strength: 6 + 2 * level,
  health: 80 + 8 * level,
  maxHealth: 80 + 8 * level,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,
  isRanged: false,
  movementType: 'naval',
  availableActions: ['move', 'attack', 'retreat'],
  canMove: true,
  isFortified: false,
  level: level,
});

export interface unitLevel
{
  unitType: UnitType;
  unitLevel: Number;
}

export const UNIT_LEVEL_TRACKER: unitLevel[] = [
  { unitType: 'settler', unitLevel: 3 },
  { unitType: 'worker', unitLevel: 1 },
  { unitType: 'warrior', unitLevel: 4 },
  { unitType: 'archer', unitLevel: 0 },
  { unitType: 'horseman', unitLevel: 0 },
  { unitType: 'artillery', unitLevel: 0 },
  { unitType: 'tank', unitLevel: 0 },
  { unitType: 'rifleman', unitLevel: 0 },
  { unitType: 'galley', unitLevel: 0 },
  { unitType: 'warship', unitLevel: 0 },
  { unitType: 'catapult', unitLevel: 0 },
  { unitType: 'cannon', unitLevel: 0 }
];

// Ejemplo de cañon
