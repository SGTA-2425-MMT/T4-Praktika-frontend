import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameMap } from '../models/map.model';
import * as UnitModel from '../models/unit.model';
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
  units: UnitModel.Unit[];
  cities: City[];
  playerCivilization: string;
  difficulty: string;
  createdAt: Date;
  lastSaved?: Date;

  currentPhase: 'diplomacia_decisiones' | 'creacion_investigacion' | 'movimiento_accion' | 'ia';
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
      currentPhase: 'diplomacia_decisiones',
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

  foundCity(settler: UnitModel.Unit, cityName: string): City | null {
    console.log(`GameService.foundCity: Intentando fundar ciudad "${cityName}" con colono ${settler.id}`);
    const game = this.currentGame;
    if (!game) {
      console.error('No hay juego activo');
      return null;
    }

    if (settler.owner !== game.currentPlayerId || settler.type !== 'settler') {
      console.error(`Unidad inválida para fundar ciudad: propietario=${settler.owner}, tipo=${settler.type}`);
      return null;
    }

    const newCity = this.cityService.foundCity(
      cityName,
      settler,
      game.map,
      game.turn
    );

    console.log(`Ciudad creada: ${newCity.name} (ID: ${newCity.id})`);
    game.cities.push(newCity);
    console.log(`Ciudades totales: ${game.cities.length}`);

    // Eliminar el colono del juego
    game.units = game.units.filter(u => u.id !== settler.id);
    console.log(`Colono ${settler.id} eliminado`);

    // Revelar el área alrededor de la ciudad
    this.revealAroundCity(game.map, newCity.position, 3);
    console.log(`Área alrededor de la ciudad revelada`);

    // Actualizar el estado del juego
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
    this.changePhase('ia');
  }

  private processEndOfTurn(): void {
    const game = this.currentGame;
    if (!game) return;

    game.turn++;
    this.resetUnitMoves();
    this.calculateResourcesPerTurn();
    game.currentPhase = 'diplomacia_decisiones';
    this.currentGameSubject.next({ ...game });
  }

  startTurn(): void {
    const game = this.currentGame;
    if (!game) return;
    game.currentPhase = 'diplomacia_decisiones';
    this.currentGameSubject.next({ ...game });
  }

  nextPhase(): void {
    const game = this.currentGame;
    if (!game) return;

    const phases: (
      'diplomacia_decisiones' |
      'creacion_investigacion' |
      'movimiento_accion' |
      'ia'
    )[] = [
      'diplomacia_decisiones',
      'creacion_investigacion',
      'movimiento_accion',
      'ia'
    ];

    const currentIndex = phases.indexOf(game.currentPhase);

    if (currentIndex < phases.length - 1) {
      this.changePhase(phases[currentIndex + 1]);
    } else {
      this.processEndOfTurn();
      this.startTurn();
    }
  }

  changePhase(phase: 'diplomacia_decisiones' | 'creacion_investigacion' | 'movimiento_accion' | 'ia'): void {
    const game = this.currentGame;
    if (!game) return;

    game.currentPhase = phase;

    switch (phase) {
      case 'diplomacia_decisiones':
        this.processDiplomacy();
        this.changePhase('creacion_investigacion');
        return;

      case 'creacion_investigacion':
        this.updateResearch();
        this.updateCitiesProduction();
        break;

      case 'movimiento_accion':
        this.updateAvailableActions();
        break;

      case 'ia':
        this.processAI();
        this.processEndOfTurn();
        this.startTurn();
        return;
    }

    this.currentGameSubject.next({ ...game });
  }

  private processDiplomacy(): void {
    // Placeholder for diplomacy logic
  }

  private processResourceCollection(): void {
    const game = this.currentGame;
    if (!game) return;
    game.gold += game.goldPerTurn;
    game.science += game.sciencePerTurn;
    game.culture += game.culturePerTurn;
  }

  private processAI(): void {
    // Placeholder for AI logic
  }

  private updateAvailableActions(): void {
    const game = this.currentGame;
    if (!game) return;

    game.units.forEach(unit => {
      if (unit.owner === game.currentPlayerId && unit.movementPoints > 0) {
        const availableActions: UnitModel.UnitAction[] = ['move'];

        if (unit.type === 'settler' && unit.movementPoints > 0) {
          availableActions.push('found_city');
        }

        if (unit.type === 'worker' && unit.movementPoints > 0) {
          availableActions.push('build');
        }

        if (unit.type === 'warrior' && unit.movementPoints > 0) {
          availableActions.push('attack');

        }

        if (unit.type === 'archer' && unit.movementPoints > 0) {
          availableActions.push('attack');
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

  private createNewUnit(type: string, position: { x: number; y: number }, owner: string): UnitModel.Unit | null {
    const id = `${type}_${Date.now()}`;

    switch (type) {
      case 'warrior':
        return UnitModel.createWarrior(owner , position.x, position.y, 1);
      case 'settler':
        return UnitModel.createSettler(owner , position.x, position.y, 1);
      case 'worker':
        return UnitModel.createWorker(owner , position.x, position.y, 1);
      case 'archer':
        return UnitModel.createArcher(owner , position.x, position.y, 1);
      case 'horseman':
        return UnitModel.createHorseman(owner , position.x, position.y, 1);
      case 'swordsman':
        return UnitModel.createWarrior(owner , position.x, position.y, 2);
      case 'catapult':
        return UnitModel.createCatapult(owner , position.x, position.y, 1);
      case 'warship':
        return UnitModel.createWarship(owner , position.x, position.y, 1);
      case 'cannon' :
        return UnitModel.createCannon(owner , position.x, position.y, 1);
      case 'galley':
        return UnitModel.createGalley(owner , position.x, position.y, 1);
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

  private createStartingUnits(civilization: string, position: { x: number; y: number }): UnitModel.Unit[] {
    const settler = UnitModel.createSettler('player1', position.x, position.y, 1);
    const owner = 'player1';
    const warrior = UnitModel.createWarrior(owner , position.x, position.y, 1);
    return [settler, warrior];
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
        unit.attacksPerTurn = unit.maxattacksPerTurn;
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
