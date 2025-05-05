export type UnitType = 
  // Unidades terrestres
  'settler' | 'warrior' | 'archer' | 'horseman' | 'swordsman' | 'catapult' |
  // Unidades navales
  'galley' | 'warship' | 
  // Unidades aéreas (opcionales)
  'fighter' | 'bomber' |
  // Especiales
  'worker' | 'scout';

export type UnitAction = 'move' | 'attack' | 'fortify' | 'sleep' | 'skip' | 'found_city' | 'build_improvement';

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
  experience: number;
  abilities: string[];
  canMove: boolean;
  isFortified: boolean;
  rangedStrength?: number;
  range?: number;
  attacksPerTurn?: number;
  movementType?: 'land' | 'naval' | 'air';
  cost?: number;
  
  // Nuevos campos para mejorar la jugabilidad
  availableActions?: UnitAction[];
  turnsToComplete?: number; // Para acciones como construir mejoras
  currentAction?: UnitAction; // Acción actual que está realizando
  targetPosition?: {x: number, y: number}; // Posición objetivo para acciones como moverse
  isAutoExploring?: boolean; // Si la unidad está en modo exploración automática
  experiencePoints?: number; // Puntos de experiencia acumulados
  level?: number; // Nivel de la unidad
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
