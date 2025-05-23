export type UnitType =
  // Unidades terrestres
  'settler' | 'warrior' | 'archer' | 'horseman' | 'artillery' | 'tank' | 'rifleman' |
  // Unidades navales
  'galley' | 'warship' |
  // Unidades aéreas (opcionales)
  // Especiales
  'worker' | 'catapult' | 'cannon';

export type UnitAction = 'move' | 'attack' |'found_city' | 'build' | 'negotiate' | 'retreat' | 'navigate' |
  'build_farm' | 'build_mine' | 'build_road' | 'build_port' ;

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
  attackRange: number; // Alcance de ataque de la unidad, predeterminado a 1
  healthBarVisible?: boolean; // Indica si la barra de vida es visible
  canSwim: boolean; // Indica si la unidad puede nadar
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
  attackRange: 1,
  canSwim: false, // Indica si la unidad puede nadar
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
  availableActions: ['move', 'build_farm', 'build_mine', 'build_road', 'build_port', 'build_farm', 'build_mine'],
  buildingImprovement: undefined,
  canMove: true,
  isFortified: false,
  level: level,
  attackRange: 1,
  canSwim: false, // Indica si la unidad puede nadar
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
  strength: 30 + 5 * level,
  health: 120 + 15 * level,
  maxHealth: 120 + 15 * level,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,

  isRanged: false,
  attackRange: 1, // Valor predeterminado
  availableActions: ['move', 'attack', 'retreat'],
  canMove: true,
  isFortified: false,
  level: level,
  canSwim: false, // Indica si la unidad puede nadar
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
  strength: 30 + 3 * level,
  health: 80 + 10 * level,
  maxHealth: 80 + 10 * level,

  isRanged: true,
  maxRange: 2,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,

  availableActions: ['move', 'attack', 'retreat'],
  canMove: true,
  isFortified: false,
  level: level,
  attackRange: 2,
  canSwim: false, // Indica si la unidad puede nadar
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
  strength: 40 + 10 * level,
  health: 150 + 12 * level,
  maxHealth: 150 + 12 * level,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,

  isRanged: false,
  availableActions: ['move', 'attack'],
  canMove: true,
  isFortified: false,
  level: level,
  attackRange: 1,
  canSwim: false, // Indica si la unidad puede nadar
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
  strength: 60 + 88 * level,
  health: 200 + 8 * level,
  maxHealth: 200 + 8 * level,

  isRanged: true,
  maxRange: 7,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,

  availableActions: ['move', 'attack'],
  canMove: true,
  isFortified: false,
  level: level,
  attackRange: 1,
  canSwim: false, // Indica si la unidad puede nadar
});

// Factory for Catapult (maps to artillery)
export const createCatapult = (owner: string, x: number, y: number, level: number): Unit => ({
  id: `catapult_${Date.now()}`,
  name: 'Catapult',
  type: 'catapult',
  owner,
  position: { x, y },
  turnsToComplete: 0,
  cost: 0,
  movementPoints: 2,
  maxMovementPoints: 2,
  strength: 60 + 20 * level,
  health: 100 + 8 * level,
  maxHealth: 100 + 8 * level,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,
  isRanged: true,
  maxRange: 3,
  availableActions: ['move', 'attack'],
  canMove: true,
  isFortified: false,
  level: level,
  attackRange: 3,
  canSwim: false, // Indica si la unidad puede nadar
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
  availableActions: ['move', 'attack'],
  canMove: true,
  isFortified: false,
  level: level,
  attackRange: 1,
  canSwim: true, // Indica si la unidad puede nadar
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
  strength: 60 + 2 * level,
  health: 80 + 8 * level,
  maxHealth: 80 + 8 * level,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,
  isRanged: false,
  movementType: 'naval',
  availableActions: ['move', 'attack'],
  canMove: true,
  isFortified: false,
  level: level,
  attackRange: 1,
  canSwim: true, // Indica si la unidad puede nadar
});

// Factory for Tank
export const createTank = (owner: string, x: number, y: number, level: number): Unit => ({
  id: `tank_${Date.now()}`,
  name: 'Tank',
  type: 'tank',
  owner,
  position: { x, y },
  turnsToComplete: 0,
  cost: 0,
  movementPoints: 4,
  maxMovementPoints: 4,
  strength: 200 + 50 * level,
  health: 450 + 20 * level,
  maxHealth: 150 + 20 * level,
  attacksPerTurn: 2,
  maxattacksPerTurn: 2,
  isRanged: false,
  availableActions: ['move', 'attack'],
  canMove: true,
  isFortified: false,
  level: level,
  attackRange: 5,
  canSwim: false, // Indica si la unidad puede nadar
});

// FActory for rifleman
export const createRifleman = (owner: string, x: number, y: number, level: number): Unit => ({
  id: `rifleman_${Date.now()}`,
  name: 'Rifleman',
  type: 'rifleman',
  owner,
  position: { x, y },
  turnsToComplete: 0,
  cost: 0,
  movementPoints: 2,
  maxMovementPoints: 2,
  strength: 60 + 30 * level,
  health: 150 + 30 * level,
  maxHealth: 100 + 15 * level,
  attacksPerTurn: 1,
  maxattacksPerTurn: 1,
  isRanged: true,
  availableActions: ['move', 'attack'],
  canMove: true,
  isFortified: false,
  level: level,
  attackRange: 2,
  canSwim: false, // Indica si la unidad puede nadar
});

export interface unitLevel
{
  unitType: UnitType;
  unitLevel: Number;
}

export const UNIT_LEVEL_TRACKER: unitLevel[] = [
  { unitType: 'settler', unitLevel: 1 },
  { unitType: 'worker', unitLevel: 1 },
  { unitType: 'warrior', unitLevel: 1 },
  { unitType: 'archer', unitLevel: -1 },
  { unitType: 'horseman', unitLevel: -1 },
  { unitType: 'artillery', unitLevel: -1 },
  { unitType: 'tank', unitLevel: -1 },
  { unitType: 'rifleman', unitLevel: -1 },
  { unitType: 'galley', unitLevel: -1 },
  { unitType: 'warship', unitLevel: -1 },
  { unitType: 'catapult', unitLevel: -1 },

];

// Ejemplo de cañon
