import { Injectable, EventEmitter } from '@angular/core';
import { Unit } from '../models/unit.model';
import { City } from '../models/city.model';
import { AnimationService } from './animation.service';
import { SharedWarGameService } from './shared-war-game.service';
import { GameService } from './game.service';


@Injectable({
  providedIn: 'root',
})
export class WarService {
  unitAttackEvent = new EventEmitter<{ attacker: Unit; defender: Unit; damage: number }>();
  cityAttackEvent = new EventEmitter<{ attacker: Unit; city: City; damage: number }>();

  constructor(
    private readonly sharedWarGameService: SharedWarGameService,
    private readonly animationService: AnimationService,
    private gameService: GameService
  ) {}

  // Handle unit vs unit combat
  attackUnit(attacker: Unit, defender: Unit): boolean {
    if (!this.canAttack(attacker, defender)) {
      console.error('Attack not allowed');
      return false;
    }

    const damage = this.calculateDamage(attacker, defender);
    this.sharedWarGameService.applyDamageToUnit(defender, damage);

    // Emit event for visualization
    this.unitAttackEvent.emit({ attacker, defender, damage });

    console.log(`${attacker.name} attacked ${defender.name} for ${damage} damage!`);

    if (defender.health <= 0) {
      this.removeUnit(defender);
      console.log(`${defender.name} has been defeated!`);
    }

    attacker.attacksPerTurn = attacker.attacksPerTurn ? attacker.attacksPerTurn - 1 : 0;

    return true;
  }

  // Handle unit vs city combat
  /*
  attackCity(attacker: Unit, city: City): boolean {
    if (!this.canAttackCity(attacker, city)) {
      console.error('Attack not allowed');
      return false;
    }

    const damage = this.calculateDamage(attacker, city);
    this.sharedWarGameService.applyDamageToUnit(city, damage);

    // Emit event for visualization
    this.unitAttackEvent.emit({ attacker, city, damage });

    console.log(`${attacker.name} attacked ${city.name} for ${damage} damage!`);

    if (city.health <= 0) {
      this.removeUnit(city);
      console.log(`${city.name} has been defeated!`);
    }

    attacker.attacksPerTurn = attacker.attacksPerTurn ? attacker.attacksPerTurn - 1 : 0;

    return true;
  }*/

  // Check if a unit can attack another unit
  private canAttack(attacker: Unit, defender: Unit): boolean {
    console.log('Checking if attack is allowed...');
    console.log('Attacker:', attacker);
    console.log('Defender:', defender);
    
    // Check if trying to attack an allied unit
    if (attacker.owner === defender.owner) {
      console.error('Attack not allowed: Cannot attack your own units.');
      alert('Cannot attack your own units.');
      return false;
    }

    if (!attacker.attacksPerTurn || attacker.attacksPerTurn <= 0) {
      console.error('Attack not allowed: Attacker has no attacks left this turn.');
      alert('No attacks left this turn.');
      return false; // No attacks left this turn
    }

    const distance = this.getDistance(attacker.position, defender.position);

    if (attacker.isRanged) {
      console.log('Ranged attack: Distance =', distance);
      if (!attacker.maxRange || attacker.maxRange < distance) {
        console.error('Attack not allowed: Target is out of range for ranged units.');
        alert('Target is out of range for this ranged unit.');
        return false; // Out of range for ranged units
      }
    } else {
      console.log('Melee attack: Distance =', distance);
      // For melee units, they can only attack adjacent units (distance = 1)
      if (distance > 1) {
        console.error('Attack not allowed: Target is not adjacent for melee units.');
        alert('Target is not adjacent. Melee units can only attack adjacent tiles.');
        return false; // Not adjacent for melee units
      }
    }

    console.log('Attack is allowed.');
    return true;
  }

  // Check if a unit can attack a city
  private canAttackCity(attacker: Unit, city: City): boolean {
    console.log('Checking if attack is allowed...');
    console.log('Attacker:', attacker);
    console.log('Defender:', city);

    if (!attacker.attacksPerTurn || attacker.attacksPerTurn <= 0) {
      console.error('Attack not allowed: Attacker has no attacks left this turn.');
      return false; // No attacks left this turn
    }

    const distance = this.getDistance(attacker.position, city.position);

    if (attacker.isRanged) {
      console.log('Ranged attack: Distance =', distance);
      if (!attacker.maxRange || attacker.maxRange < distance) {
        console.error('Attack not allowed: Target is out of range for ranged units.');
        return false; // Out of range for ranged units
      }
    } else {
      console.log('Melee attack: Distance =', distance);
      // For melee units, they can only attack adjacent units (distance = 1)
      if (distance > 1) {
        console.error('Attack not allowed: Target is not adjacent for melee units.');
        return false; // Not adjacent for melee units
      }
    }

    console.log('Attack is allowed.');
    return true;
  }

  // Calculate damage between units
  private calculateDamage(attacker: Unit, defender: Unit): number {
    const baseDamage = attacker.strength;
    const defenseBonus = defender.isFortified ? 5 : 0;

    // Roll a dice (1-6)
    const diceRoll = Math.floor(Math.random() * 6) + 1;

    // Determine multiplier based on dice roll
    let multiplier = 1.0;
    switch (diceRoll) {
        case 1:
            // No multiplier
            break;
        case 2:
            multiplier = 1.2;
            break;
        case 3:
            multiplier = 1.3;
            break;
        case 4:
            multiplier = 1.4;
            break;
        case 5:
            multiplier = 1.5;
            break;
        case 6:
            multiplier = 2.0; // Critical hit
            break;
    }

    // Apply multiplier to base damage
    const damage = Math.max(0, (baseDamage - defenseBonus) * multiplier);

    console.log(`Dice roll: ${diceRoll}, Multiplier: ${multiplier}, Damage: ${damage}`);
    return damage;
  }

  private removeUnit(unit: Unit): void {
    const game = this.gameService.currentGame;
    if (!game) {alert("noo"); return;}

    game.units = game.units.filter(u => u.id !== unit.id);
  }

  // Capture a city
  private captureCity(attacker: Unit, city: City): void {
    this.sharedWarGameService.captureCity(attacker, city);
  }
  // Calculate distance between two positions
  private getDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    // Using Chebyshev distance to count diagonal tiles as distance 1
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
  }
  isUnitInRange(attacker: Unit, target: Unit): boolean {
    if (!attacker.attackRange) {
      alert(`La unidad atacante ${attacker.id} no tiene un rango de ataque definido.`);
      console.error(`La unidad atacante ${attacker.id} no tiene un rango de ataque definido.`);
      return false;
    }

    const distance = this.getDistance(attacker.position, target.position);
    if (distance > attacker.attackRange) {
      alert(`La unidad ${attacker.id} no puede atacar a la unidad ${target.id} porque está fuera de rango.`);
      console.error(`La unidad ${attacker.id} no puede atacar a la unidad ${target.id} porque está fuera de rango.`);
      return false;
    }
    return distance <= attacker.attackRange;
  }

  triggerAttackAnimation(x: number, y: number, damage: number, attackType: 'melee' | 'ranged' | 'explosion'): void {
    const waitForAnimationService = (retries: number) => {
      if (this.animationService.isPhaserReady()) {
        // Play the animation once the service is ready
        this.animationService.playExplosion(x, y, damage);
      } else if (retries > 0) {
        console.warn(`Animation service not ready yet. Retrying in 500ms... (${retries} retries left)`);
        setTimeout(() => waitForAnimationService(retries - 1), 500);
      } else {
        console.error('Animation service still not ready. Animation skipped.');
      }
    };

    // Start the retry mechanism with a maximum of 5 retries
    waitForAnimationService(5);
  }
}
