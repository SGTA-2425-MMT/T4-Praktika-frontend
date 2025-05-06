import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameMap } from '../models/map.model';
import { Unit, UnitAction } from '../models/unit.model';  // Importamos UnitAction
import { City } from '../models/city.model';
import { MapGeneratorService } from './map-generator.service';
import { CityService } from './city.service';

export interface GameSettings {
  gameName: string;
  mapSize: 'small' | 'medium' | 'large' | 'huge';
  civilization: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  numberOfOpponents: number;
}

export interface GameSession {
  id: string;
  name: string;
  turn: number;
  currentPlayerId: string;
  map: GameMap;
  units: Unit[];
  cities: City[];
  playerCivilization: string;
  difficulty: string;
  createdAt: Date;
  lastSaved?: Date;

  currentPhase: 'movement' | 'action' | 'diplomacy' | 'production' | 'research' | 'end';
  researchProgress?: {
    currentTechnology: string;
    progress: number;
    turnsLeft: number;
    totalCost: number;
  };
  discoveredTechnologies: string[];
  availableTechnologies: string[];
  gold: number;
  goldPerTurn: number;
  science: number;
  sciencePerTurn: number;
  culture: number;
  culturePerTurn: number;
  happiness: number;
  era: 'ancient' | 'classical' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'information';
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private currentGameSubject = new BehaviorSubject<GameSession | null>(null);
  private savedGames: GameSession[] = [];

  constructor(
    private mapGeneratorService: MapGeneratorService,
    private cityService: CityService
  ) {
    this.loadSavedGames();
  }

  get currentGame$(): Observable<GameSession | null> {
    return this.currentGameSubject.asObservable();
  }

  get currentGame(): GameSession | null {
    return this.currentGameSubject.value;
  }

  createNewGame(settings: GameSettings): GameSession {
    const mapDimensions = this.getMapDimensions(settings.mapSize);

    const map = this.mapGeneratorService.generateMap(mapDimensions.width, mapDimensions.height);
    const startingPosition = this.findSuitableStartingPosition(map);
    const units = this.createStartingUnits(settings.civilization, startingPosition);

    const gameSession: GameSession = {
      id: 'game_' + Date.now(),
      name: settings.gameName,
      turn: 1,
      currentPlayerId: 'player1',
      map,
      units,
      cities: [],
      playerCivilization: settings.civilization,
      difficulty: settings.difficulty,
      createdAt: new Date(),
      currentPhase: 'movement',
      discoveredTechnologies: [],
      availableTechnologies: [],
      gold: 0,
      goldPerTurn: 0,
      science: 0,
      sciencePerTurn: 0,
      culture: 0,
      culturePerTurn: 0,
      happiness: 0,
      era: 'ancient'
    };


    this.currentGameSubject.next(gameSession);

    this.revealInitialMap(gameSession);

    return gameSession;
  }

  foundCity(settler: Unit, cityName: string): City | null {
    const game = this.currentGame;
    if (!game) return null;

    if (settler.owner !== game.currentPlayerId || settler.type !== 'settler') {
      return null;
    }

    const newCity = this.cityService.foundCity(
      cityName,
      settler,
      game.map,
      game.turn
    );

    game.cities.push(newCity);
    game.units = game.units.filter(u => u.id !== settler.id);
    this.revealAroundCity(game.map, newCity.position, 3);
    this.currentGameSubject.next({ ...game });

    return newCity;
  }

  private revealAroundCity(map: GameMap, position: { x: number, y: number }, radius: number): void {
    this.revealAroundUnit(map, position, radius);
  }

  loadGame(gameId: string): GameSession | null {
    const game = this.savedGames.find(game => game.id === gameId);
    if (game) {
      this.currentGameSubject.next(game);
      return game;
    }
    return null;
  }

  saveGame(): boolean {
    const game = this.currentGame;
    if (!game) return false;


    game.lastSaved = new Date();
    const existingIndex = this.savedGames.findIndex(g => g.id === game.id);
    if (existingIndex >= 0) {
      this.savedGames[existingIndex] = game;
    } else {
      this.savedGames.push(game);
    }


    this.persistSavedGames();
    return true;
  }

  getSavedGames(): GameSession[] {
    return [...this.savedGames];
  }

  deleteGame(gameId: string): boolean {
    const initialLength = this.savedGames.length;
    this.savedGames = this.savedGames.filter(game => game.id !== gameId);


    if (this.savedGames.length < initialLength) {
      this.persistSavedGames();
      return true;
    }
    return false;
  }

  endTurn(): void {
    this.changePhase('end');
  }

  private processEndOfTurn(): void {
    const game = this.currentGame;
    if (!game) return;


    game.gold += game.goldPerTurn;
    game.science += game.sciencePerTurn;
    game.culture += game.culturePerTurn;
    game.turn++;

    game.units.forEach(unit => {
      if (unit.owner === game.currentPlayerId) {
        unit.movementPoints = unit.maxMovementPoints;
        unit.canMove = true;
      }
    });


    game.currentPhase = 'movement';
    this.currentGameSubject.next({ ...game });

  }

  startTurn(): void {
    const game = this.currentGame;
    if (!game) return;

    game.currentPhase = 'movement';
    this.resetUnitMoves();
    this.calculateResourcesPerTurn();
    this.currentGameSubject.next({ ...game });

    console.log(`¡Comienza el turno ${game.turn}!`);
  }

  nextPhase(): void {
    const game = this.currentGame;
    if (!game) return;

    const phases: ('movement' | 'action' | 'diplomacy' | 'production' | 'research' | 'end')[] =
      ['movement', 'action', 'diplomacy', 'production', 'research', 'end'];

    const currentIndex = phases.indexOf(game.currentPhase);

    if (currentIndex < phases.length - 1) {
      this.changePhase(phases[currentIndex + 1]);
    } else {
      this.processEndOfTurn();
      this.startTurn();
    }
  }

  changePhase(phase: 'movement' | 'action' | 'diplomacy' | 'production' | 'research' | 'end'): void {
    const game = this.currentGame;
    if (!game) return;

    game.currentPhase = phase;

    switch (phase) {
      case 'movement':
        break;

      case 'action':
        this.updateAvailableActions();
        break;

      case 'diplomacy':
        break;

      case 'production':
        this.updateCitiesProduction();
        break;

      case 'research':
        this.updateResearch();
        break;

      case 'end':
        this.processEndOfTurn();
        break;
    }

    this.currentGameSubject.next({ ...game });
  }

  private updateAvailableActions(): void {
    const game = this.currentGame;
    if (!game) return;

    game.units.forEach(unit => {
      if (unit.owner === game.currentPlayerId && unit.movementPoints > 0) {
        const availableActions: UnitAction[] = ['move'];

        if (unit.type === 'settler' && unit.movementPoints > 0) {
          availableActions.push('found_city');
        }

        if (unit.type === 'worker' && unit.movementPoints > 0) {
          availableActions.push('build_improvement');
        }

        if (unit.movementPoints > 0) {
          availableActions.push('fortify', 'skip');
        }

        unit.availableActions = availableActions;
      }
    });
  }

  private updateResearch(): void {
    const game = this.currentGame;
    if (!game || !game.researchProgress) return;

    game.researchProgress.progress += game.sciencePerTurn;

    if (game.researchProgress.progress >= game.researchProgress.totalCost) {
      const completedTechnology = game.researchProgress.currentTechnology;

      game.discoveredTechnologies.push(completedTechnology);
      this.updateAvailableTechnologies();
      console.log(`¡Investigación completada: ${completedTechnology}!`);

      game.researchProgress = undefined;
    } else {
      game.researchProgress.turnsLeft = Math.ceil(
        (game.researchProgress.totalCost - game.researchProgress.progress) / game.sciencePerTurn
      );
    }
  }

  private processCitiesProduction(game: GameSession): void {
    game.cities.forEach(city => {
      if (city.currentProduction) {
        city.currentProduction.progress += city.productionPerTurn;

        if (city.currentProduction.progress >= city.currentProduction.cost) {
          this.completeProduction(game, city);
        } else {
          city.currentProduction.turnsLeft = Math.ceil(
            (city.currentProduction.cost - city.currentProduction.progress) / city.productionPerTurn
          );
        }
      }

      this.processGrowth(city);
    });
  }

  private completeProduction(game: GameSession, city: City): void {
    if (!city.currentProduction) return;

    if (city.currentProduction.type === 'unit') {
      const unitType = city.currentProduction.id.split('_')[0];

      const newUnit = this.createNewUnit(unitType, city.position, city.ownerId);

      if (newUnit) {
        game.units.push(newUnit);

        console.log(`Ciudad ${city.name} completó la producción de ${city.currentProduction.name}`);
      }
    }

    city.currentProduction = undefined;
  }

  private createNewUnit(type: string, position: { x: number, y: number }, owner: string): Unit | null {
    const id = `${type}_${Date.now()}`;
    const baseUnit: Unit = {
      id,
      position: { ...position },
      owner,
      movementPoints: 0,
      health: 100,
      maxHealth: 100,
      isRanged: false,
      experience: 0,
      abilities: [],
      canMove: false,
      isFortified: false,
      strength: 0,
      maxMovementPoints: 0,
      name: '',
      type: 'warrior',
      movementType: 'land',
      cost: 0
    };

    switch (type) {
      case 'warrior':
        return {
          ...baseUnit,
          name: 'Guerrero',
          type: 'warrior',
          strength: 5,
          maxMovementPoints: 2,
          movementType: 'land',
          cost: 40
        };
      case 'settler':
        return {
          ...baseUnit,
          name: 'Colono',
          type: 'settler',
          strength: 0,
          maxMovementPoints: 2,
          movementType: 'land',
          cost: 80
        };
      case 'worker':
        return {
          ...baseUnit,
          name: 'Trabajador',
          type: 'worker',
          strength: 0,
          maxMovementPoints: 2,
          movementType: 'land',
          cost: 60
        };
      case 'archer':
        return {
          ...baseUnit,
          name: 'Arquero',
          type: 'archer',
          strength: 4,
          rangedStrength: 6,
          range: 2,
          isRanged: true,
          maxMovementPoints: 2,
          movementType: 'land',
          cost: 50
        };
      case 'horseman':
        return {
          ...baseUnit,
          name: 'Jinete',
          type: 'horseman',
          strength: 7,
          maxMovementPoints: 4,
          movementType: 'land',
          cost: 70
        };
      case 'swordsman':
        return {
          ...baseUnit,
          name: 'Espadachín',
          type: 'swordsman',
          strength: 9,
          maxMovementPoints: 2,
          movementType: 'land',
          cost: 75
        };
      case 'catapult':
        return {
          ...baseUnit,
          name: 'Catapulta',
          type: 'catapult',
          strength: 3,
          rangedStrength: 10,
          range: 2,
          isRanged: true,
          maxMovementPoints: 1,
          movementType: 'land',
          cost: 90
        };
      case 'galley':
        return {
          ...baseUnit,
          name: 'Galera',
          type: 'galley',
          strength: 4,
          maxMovementPoints: 3,
          movementType: 'naval',
          cost: 65
        };
      case 'warship':
        return {
          ...baseUnit,
          name: 'Barco de Guerra',
          type: 'warship',
          strength: 8,
          maxMovementPoints: 4,
          movementType: 'naval',
          cost: 85
        };
      case 'scout':
        return {
          ...baseUnit,
          name: 'Explorador',
          type: 'scout',
          strength: 2,
          maxMovementPoints: 3,
          movementType: 'land',
          cost: 35
        };
      default:
        console.error(`Tipo de unidad desconocido: ${type}`);
        return null;
    }
  }

  private processGrowth(city: City): void {
    city.food += city.foodPerTurn;

    if (city.food >= city.foodToGrow) {
      city.population += 1;
      city.food -= city.foodToGrow;
      city.foodToGrow = Math.floor(city.foodToGrow * 1.5);

      console.log(`La ciudad ${city.name} ha crecido a población ${city.population}`);
    }
  }

  exitGame(): void {
    this.currentGameSubject.next(null);
  }

  private getMapDimensions(size: string): { width: number; height: number } {
    switch (size) {
/*
      case 'small': return { width: 32, height: 24 };
      case 'medium': return { width: 48, height: 36 };
      case 'large': return { width: 64, height: 48 };
      case 'huge': return { width: 80, height: 60 };*/
      default: return { width: 50, height: 50 };
    }
  }

  private findSuitableStartingPosition(map: GameMap): { x: number; y: number } {
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = Math.floor(Math.random() * map.width);
      const y = Math.floor(Math.random() * map.height);

      const tile = map.tiles[y][x];
      if (tile.terrain === 'grassland' || tile.terrain === 'plains') {
        return { x, y };
      }
    }

    return {
      x: Math.floor(map.width / 2),
      y: Math.floor(map.height / 2)
    };
  }

  private createStartingUnits(civilization: string, position: { x: number; y: number }): Unit[] {
    return [
      {
        id: 'settler_1',
        name: 'Colono',
        type: 'settler',
        owner: 'player1',
        position: { ...position },
        movementPoints: 2,
        maxMovementPoints: 2,
        strength: 0,
        health: 100,
        maxHealth: 100,
        isRanged: false,
        experience: 0,
        abilities: [],
        canMove: true,
        isFortified: false
      },
      {
        id: 'warrior_1',
        name: 'Guerrero',
        type: 'warrior',
        owner: 'player1',
        position: { ...position },
        movementPoints: 2,
        maxMovementPoints: 2,
        strength: 5,
        health: 100,
        maxHealth: 100,
        isRanged: false,
        experience: 0,
        abilities: [],
        canMove: true,
        isFortified: false
      }
    ];
  }

  private revealInitialMap(game: GameSession): void {
    game.units.forEach(unit => {
      if (unit.owner === game.currentPlayerId) {
        this.revealAroundUnit(game.map, unit.position, 3);
      }
    });
  }

  private revealAroundUnit(map: GameMap, position: { x: number; y: number }, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = position.x + dx;
        const y = position.y + dy;

        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
          if (Math.sqrt(dx * dx + dy * dy) <= radius) {
            map.tiles[y][x].isExplored = true;
            map.tiles[y][x].isVisible = true;
          }
        }
      }
    }
  }

  private persistSavedGames(): void {
    try {
      localStorage.setItem('savedGames', JSON.stringify(this.savedGames));
    } catch (error) {
      console.error('Error al guardar partidas:', error);
    }
  }

  private loadSavedGames(): void {
    try {
      const savedGamesData = localStorage.getItem('savedGames');
      if (savedGamesData) {
        this.savedGames = JSON.parse(savedGamesData);
      }
    } catch (error) {
      console.error('Error al cargar partidas guardadas:', error);
      this.savedGames = [];
    }
  }

  private resetUnitMoves(): void {
    const game = this.currentGame;
    if (!game) return;

    game.units.forEach(unit => {
      if (unit.owner === game.currentPlayerId) {
        unit.movementPoints = unit.maxMovementPoints;
        unit.canMove = true;
      }
    });
  }

  private calculateResourcesPerTurn(): void {
    const game = this.currentGame;
    if (!game) return;

    game.goldPerTurn = game.cities.reduce((sum, city) => sum + city.goldPerTurn, 0);
    game.sciencePerTurn = game.cities.reduce((sum, city) => sum + city.sciencePerTurn, 0);
    game.culturePerTurn = game.cities.reduce((sum, city) => sum + city.culturePerTurn, 0);
  }

  private updateAvailableTechnologies(): void {
    const game = this.currentGame;
    if (!game) return;

    // Logic to update available technologies based on discovered ones
  }

  private updateCitiesProduction(): void {
    const game = this.currentGame;
    if (!game) return;

    this.processCitiesProduction(game);
  }
}
