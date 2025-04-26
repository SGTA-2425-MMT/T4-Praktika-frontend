export type UnitType = 'warrior' | 'archer' | 'scout' | 'settler' | 'worker' | 'swordsman' | 'horseman' | 'catapult';
export type UnitAbility = 'woodsmanship' | 'amphibious' | 'drill' | 'medic' | 'sentry';

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
  range?: number; // Para unidades a distancia
  isRanged: boolean;
  experience: number;
  abilities: UnitAbility[];
  canMove: boolean;
  isFortified: boolean;
}
