import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { GameSession } from './services/game.service';
import { Unit } from './models/unit.model';
import { City } from './models/city.model';
import { MapTile } from './models/map.model';

// Modelos mínimos para la IA
export interface IAUnitMinimal {
  id: string;
  type: string;
  position: { x: number; y: number };
  owner: string;
  health: number;
  movementPoints: number;
  strength: number;
  level: number;
}

export interface IACityMinimal {
  id: string;
  name: string;
  position: { x: number; y: number };
  owner: string;
  population: number;
}

export interface IARequestData {
  aiUnits: IAUnitMinimal[];
  playerUnits: IAUnitMinimal[];
  aiCities: IACityMinimal[];
  playerCities: IACityMinimal[];
  maxUnitsAllowed: number;
  era: string;
}

export interface IAResponse {
  unitUpdates: Array<{
    id: string;
    newPosition: { x: number; y: number };
    newHealth: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) { }

  /**
   * Prepara y envía al backend solo la información mínima necesaria para la IA
   */
  processAITurn(gameSession: GameSession): Observable<IAResponse> {
    const req = this.prepareMinimalRequest(gameSession);
    return this.http.post<IAResponse>(`${this.baseUrl}/ia/process-turn`, req).pipe(
      catchError(err => {
        console.error('Error IA:', err);
        return of({ unitUpdates: [] });
      })
    );
  }

  /**
   * Extrae solo la información relevante para la IA
   */
  private prepareMinimalRequest(gameSession: GameSession): IARequestData {
    const playerId = gameSession.currentPlayerId;
    const aiIds = gameSession.players.filter(p => p.id !== playerId).map(p => p.id);
    const era = gameSession.era;
    const maxUnitsAllowed = this.getMaxUnitsByEra(era);

    // Unidades y ciudades mínimas
    const aiUnits = gameSession.units.filter(u => aiIds.includes(u.owner)).slice(0, maxUnitsAllowed).map(this.unitMinimal);
    const playerUnits = gameSession.units.filter(u => u.owner === playerId).map(this.unitMinimal);
    const aiCities = gameSession.cities.filter(c => aiIds.includes(c.ownerId)).map(this.cityMinimal);
    const playerCities = gameSession.cities.filter(c => c.ownerId === playerId).map(this.cityMinimal);

    return { aiUnits, playerUnits, aiCities, playerCities, maxUnitsAllowed, era };
  }

  private unitMinimal(u: Unit): IAUnitMinimal {
    return {
      id: u.id,
      type: u.type,
      position: { ...u.position },
      owner: u.owner,
      health: u.health,
      movementPoints: u.movementPoints,
      strength: u.strength,
      level: u.level
    };
  }

  private cityMinimal(c: City): IACityMinimal {
    return {
      id: c.id,
      name: c.name,
      position: { ...c.position },
      owner: c.ownerId,
      population: c.population
    };
  }

  private getMaxUnitsByEra(era: string): number {
    switch (era) {
      case 'ancient': return 5;
      case 'medieval': return 8;
      case 'age_of_discovery': return 12;
      case 'modern': return 16;
      default: return 5;
    }
  }

  /**
   * Genera nuevas unidades para las civilizaciones rivales si tienen menos del máximo permitido
   * Modifica el gameSession en sitio
   */
  ensureRivalUnits(gameSession: GameSession): void {
    const playerId = gameSession.currentPlayerId;
    const aiPlayers = gameSession.players.filter(p => p.id !== playerId);
    const era = gameSession.era;
    const maxUnitsAllowed = this.getMaxUnitsByEra(era);

    aiPlayers.forEach(ai => {
      const aiUnits = gameSession.units.filter(u => u.owner === ai.id);
      const aiCities = gameSession.cities.filter(c => c.ownerId === ai.id);
      const unitsToGenerate = maxUnitsAllowed - aiUnits.length;
      if (unitsToGenerate > 0 && aiCities.length > 0) {
        for (let i = 0; i < unitsToGenerate; i++) {
          // Selecciona una ciudad aleatoria de la IA
          const city = aiCities[Math.floor(Math.random() * aiCities.length)];
          // Elige tipo de unidad según la era (simplificado)
          const type = this.getDefaultUnitTypeForEra(era);
          const newUnit = this.createAIUnit(type, ai.id, city.position, era);
          gameSession.units.push(newUnit);
        }
      }
    });
  }

  /**
   * Devuelve el tipo de unidad básica para la era
   */
  private getDefaultUnitTypeForEra(era: string): string {
    switch (era) {
      case 'ancient': return 'warrior';
      case 'medieval': return 'archer';
      case 'age_of_discovery': return 'rifleman';
      case 'modern': return 'tank';
      default: return 'warrior';
    }
  }

  /**
   * Crea una unidad de IA básica
   */
  private createAIUnit(type: string, owner: string, position: {x: number, y: number}, era: string): Unit {
    // Puedes personalizar los stats según la era o tipo
    return {
      id: `${type}_${owner}_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      owner,
      position: { ...position },
      health: 100,
      movementPoints: 2,
      strength: 10,
      level: 1,
      maxMovementPoints: 2,
      maxHealth: 100,
      isRanged: type === 'archer' || type === 'rifleman',
      canMove: true,
      isFortified: false,
      maxattacksPerTurn: 1,
      attacksPerTurn: 1,
      cost: 0,
      attackRange: (type === 'archer' || type === 'rifleman') ? 2 : 1,
      canSwim: false
    } as Unit;
  }

  /**
   * Obtiene los cambios de posición y salud de las unidades IA tras el turno
   * @param gameId ID del juego
   */
  fetchAIUnitUpdates(gameId: string): Observable<IAResponse> {
    return this.http.post<IAResponse>(`/api/games/${gameId}/endTurn/ai-units`, {}).pipe(
      catchError(err => {
        console.error('Error obteniendo cambios de unidades IA:', err);
        return of({ unitUpdates: [] });
      })
    );
  }

  /**
   * Aplica los cambios de la IA al estado local del juego
   */
  applyAIUnitUpdates(unitUpdates: IAResponse['unitUpdates'], gameSession: GameSession): void {
    unitUpdates.forEach(update => {
      const unit = gameSession.units.find(u => u.id === update.id);
      if (unit) {
        unit.position = { ...update.newPosition };
        unit.health = update.newHealth;
        if (unit.health <= 0) {
          // Eliminar la unidad si ha muerto
          gameSession.units = gameSession.units.filter(u => u.id !== unit.id);
        }
      }
    });
  }
}
