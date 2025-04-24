export type UnitType = 'military' | 'civilian' | 'support';
export type UnitClass = 'melee' | 'ranged' | 'siege' | 'naval' | 'air' | 'settler' | 'worker' | 'scout';

export interface Unit {
  id: string;
  name: string;
  ownerId: string;
  type: UnitType;
  class: UnitClass;
  attack: number;
  defense: number;
  rangedAttack?: number;
  range?: number;
  movementPoints: number;
  movementRemaining: number;
  health: number;
  maxHealth: number;
  experience: number;
  level: number;
  abilities: string[];
  x: number;
  y: number;
  movePath?: {x: number, y: number}[];
  isFortified: boolean;
  isAlerted: boolean;
}
