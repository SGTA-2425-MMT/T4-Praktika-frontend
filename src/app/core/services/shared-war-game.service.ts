import { GameService, GameSession } from './game.service';
import { Injectable } from '@angular/core';
import { Unit } from '../models/unit.model';
import { City } from '../models/city.model';


@Injectable({
  providedIn: 'root',
})
export class SharedWarGameService {
  // Lógica compartida entre WarService y GameService

  calculateDistance(unit1: Unit, unit2: Unit): number {
    return Math.sqrt(
      Math.pow(unit1.position.x - unit2.position.x, 2) +
      Math.pow(unit1.position.y - unit2.position.y, 2)
    );
  }

  isUnitInRange(attacker: Unit, target: Unit): boolean {
    if (!attacker.attackRange) {
      console.error(`La unidad atacante ${attacker.id} no tiene un rango de ataque definido.`);
      return false;
    }

    const distance = this.calculateDistance(attacker, target);
    return distance <= attacker.attackRange;
  }

  attackUnit(attacker: Unit, defender: Unit): boolean {
    if (!this.isUnitInRange(attacker, defender)) {
      console.error('Attack not allowed');
      return false;
    }

    const damage = this.calculateDamage(attacker, defender);
    defender.health -= damage;

    return true;
  }

  calculateDamage(attacker: Unit, defender: Unit): number {
    return Math.max(0, attacker.strength - defender.strength);
  }

  applyDamageToUnit(unit: Unit, damage: number): void {
    unit.health -= damage;
    if (unit.health <= 0) {
      console.log(`Unidad ${unit.id} ha sido destruida.`);
    }
  }

  applyDamageToCity(city: City, damage: number): void {
    city.health -= damage;
    if (city.health <= 0) {
      console.log(`Ciudad ${city.name} ha sido capturada.`);
    }
  }



  captureCity(attacker: Unit, city: City): void {
    console.log(`Unidad ${attacker.id} ha capturado la ciudad ${city.name}.`);
  }

  // Otros métodos compartidos pueden añadirse aquí
}
