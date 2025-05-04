export type UnitType = 'settler' | 'warrior' | 'archer' | 'horseman' | 'swordsman' | 'worker' | 'scout';

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
}
