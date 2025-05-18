import { Injectable, EventEmitter } from '@angular/core';
import { Unit } from '../models/unit.model';
import { City } from '../models/city.model';
import { AnimationService } from './animation.service';
import { SharedWarGameService } from './shared-war-game.service';

@Injectable({
  providedIn: 'root',
})
export class WarService {
  unitAttackEvent = new EventEmitter<{ attacker: Unit; defender: Unit; damage: number }>();
  cityAttackEvent = new EventEmitter<{ attacker: Unit; city: City; damage: number }>();

  constructor(
    private readonly sharedWarGameService: SharedWarGameService,
    private readonly animationService: AnimationService
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

    return true;
  }

  // Handle unit vs city combat
  attackCity(attacker: Unit, city: City): boolean {
    if (!this.canAttackCity(attacker, city)) {
      console.error('Attack on city not allowed');
      return false;
    }

    // Calculate damage
    const damage = attacker.strength;

    // Apply damage to the city
    this.sharedWarGameService.applyDamageToCity(city, damage);

    // Decrement attacksPerTurn
    if (attacker.attacksPerTurn && attacker.attacksPerTurn > 0) {
      attacker.attacksPerTurn -= 1;
    }

    // Emit event for visualization
    this.cityAttackEvent.emit({ attacker, city, damage });

    console.log(`${attacker.name} attacked ${city.name} for ${damage} damage!`);

    // Check if the city is captured
    if (city.health <= 0) {
      this.captureCity(attacker, city);
      console.log(`${city.name} has been captured by ${attacker.owner}!`);
    }

    return true;
  }

  // Check if a unit can attack another unit
  private canAttack(attacker: Unit, defender: Unit): boolean {
    console.log('Checking if attack is allowed...');
    console.log('Attacker:', attacker);
    console.log('Defender:', defender);

    if (!attacker.attacksPerTurn || attacker.attacksPerTurn <= 0) {
      console.error('Attack not allowed: Attacker has no attacks left this turn.');
      return false; // No attacks left this turn
    }

    if (attacker.isRanged){
      const aDistance = this.getDistance(attacker.position, defender.position);
      console.log('Ranged atack: ', aDistance);
      if (attacker.maxRange! < aDistance) {
        console.error('Attack not allowed: Target is out of range for ranged units.');
        return false; // Out of range for ranged units
      }
    }

    console.log('Attack is allowed.');
    return true;
  }

  // Check if a unit can attack a city
  private canAttackCity(attacker: Unit, city: City): boolean {
    if (attacker.movementPoints <= 0) return false; // No movement points left
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

  // Remove a unit from the game
  private removeUnit(unit: Unit): void {
    this.sharedWarGameService.removeUnitFromGame(unit);
  }

  // Capture a city
  private captureCity(attacker: Unit, city: City): void {
    this.sharedWarGameService.captureCity(attacker, city);
  }

  // Calculate distance between two positions
  private getDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y); // Manhattan distance
  }

  isUnitInRange(attacker: Unit, target: Unit): boolean {
    return this.sharedWarGameService.isUnitInRange(attacker, target);
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
