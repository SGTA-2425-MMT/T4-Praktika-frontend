import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameMap, MapTile, ImprovementType} from '../models/map.model';
import * as UnitModel from '../models/unit.model';
import { City } from '../models/city.model';
import { MapGeneratorService } from './map-generator.service';
import { CityService } from './city.service';
import { TechnologyService } from './technology.service';
import { TechEra } from '../models/technology.model';
import { TileImprovementService } from './tile-improvement.service';
import { UnitAction } from '../models/unit.model';

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

  // Subject para notificar cambios en las casillas
  private tileUpdateSubject = new BehaviorSubject<MapTile | null>(null);
  public tileUpdate$ = this.tileUpdateSubject.asObservable();

  constructor(
    private mapGeneratorService: MapGeneratorService,
    private cityService: CityService,
    private technologyService: TechnologyService,
    private injector: Injector
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
    // Primero procesamos la fase de IA (si no está en esa fase)
    if (this.currentGame && this.currentGame.currentPhase !== 'ia') {
      this.changePhase('ia');
    }
    // Luego procesamos el final del turno
    this.processEndOfTurn();
  }

  private processEndOfTurn(): void {
    const game = this.currentGame;
    if (!game) return;

    // Procesar ciudades (crecimiento, producción, etc.)
    this.processCitiesEndTurn();
    
    // Procesar acciones de los trabajadores
    this.processWorkerActions(game);

    // Incrementar turno y reiniciar estado de unidades
    game.turn++;
    this.resetUnitMoves();
    
    // Actualizar recursos totales
    this.calculateResourcesPerTurn();
    
    // Cambiar fase
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
        // Ya no llamamos a processEndOfTurn() aquí porque se maneja en endTurn()
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

    // Obtener tecnologías disponibles basadas en las ya descubiertas
    const availableTechs = this.technologyService.getAvailableTechnologies(game.discoveredTechnologies);
    game.availableTechnologies = availableTechs.map(tech => tech.id);
    
    // Actualizar la era del juego basada en las tecnologías descubiertas
    this.updateGameEra();
  }

  // Actualiza la era del juego según las tecnologías descubiertas
  private updateGameEra(): void {
    const game = this.currentGame;
    if (!game) return;
    
    // Obtener todas las tecnologías descubiertas como objetos completos
    const discoveredTechs = game.discoveredTechnologies.map(techId => 
      this.technologyService.getTechnologyById(techId)
    ).filter(tech => tech !== null);
    
    // Determinar la era actual según las tecnologías descubiertas
    const currentEra = this.technologyService.determineEra(discoveredTechs);
    
    // Actualizar la era del juego si ha cambiado
    if (this.convertTechEraToGameEra(currentEra) !== game.era) {
      const newEra = this.convertTechEraToGameEra(currentEra);
      const oldEra = game.era;
      game.era = newEra;
      console.log(`¡La civilización ha avanzado de la era ${oldEra} a la era ${newEra}!`);
      
      // Aquí se podrían añadir efectos adicionales al cambiar de era
    }
  }
  
  // Convierte el enum TechEra al formato de era usado en el juego
  private convertTechEraToGameEra(techEra: TechEra): 'ancient' | 'classical' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'information' {
    switch (techEra) {
      case TechEra.ANCIENT:
        return 'ancient';
      case TechEra.CLASSICAL:
        return 'classical';
      case TechEra.MEDIEVAL:
        return 'medieval';
      case TechEra.RENAISSANCE:
        return 'renaissance';
      case TechEra.INDUSTRIAL:
        return 'industrial';
      case TechEra.MODERN:
        return 'modern';
      default:
        return 'ancient';
    }
  }

  private updateCitiesProduction(): void {
    const game = this.currentGame;
    if (!game) return;

    this.processCitiesProduction(game);
  }

  // Actualizar una ciudad en la sesión de juego actual
  updateCity(city: City): void {
    if (!this.currentGame) return;

    const cityIndex = this.currentGame.cities.findIndex(c => c.id === city.id);
    if (cityIndex !== -1) {
      this.currentGame.cities[cityIndex] = city;
      
      // Actualizar el objeto de juego
      const updatedGame = { ...this.currentGame };
      this.currentGameSubject.next(updatedGame);
      
      // Actualizar la visualización del mapa si es necesario
      const x = city.position.x;
      const y = city.position.y;
      if (x >= 0 && x < this.currentGame.map.width && y >= 0 && y < this.currentGame.map.height) {
        // Asegurarse de que la referencia de ciudad en el mapa esté actualizada
        const tile = this.currentGame.map.tiles[y][x];
        if (tile.city) {
          tile.city = {
            id: city.id,
            name: city.name,
            level: city.level
          };
        }
      }
    }
  }

  // Obtener el servicio de ciudad
  getCityService(): CityService {
    return this.cityService;
  }
  
  // Procesar las ciudades al final del turno
  processCitiesEndTurn(): void {
    if (!this.currentGame) return;
    
    // Para cada ciudad del jugador
    this.currentGame.cities.forEach(city => {
      if (city.ownerId === this.currentGame!.currentPlayerId) {
        // Actualizar crecimiento de población
        this.cityService.growCity(city);
        
        // Actualizar producción de edificios
        this.cityService.updateBuildingProduction(city, this.currentGame!.turn);
        
        // Actualizar rendimientos de la ciudad
        this.cityService.refreshCityBuildingEffects(city);
        
        // Otros procesos de ciudad...
      }
    });
    
    // Actualizar recursos totales del jugador
    this.calculatePlayerResources();
  }
  
  // Calcular recursos totales del jugador
  private calculatePlayerResources(): void {
    if (!this.currentGame) return;
    
    // Reiniciar valores
    let goldPerTurn = 0;
    let sciencePerTurn = 0;
    let culturePerTurn = 0;
    
    // Sumar contribuciones de todas las ciudades del jugador
    this.currentGame.cities.forEach(city => {
      if (city.ownerId === this.currentGame!.currentPlayerId) {
        goldPerTurn += city.goldPerTurn;
        sciencePerTurn += city.sciencePerTurn;
        culturePerTurn += city.culturePerTurn;
      }
    });
    
    // Actualizar valores en el juego
    this.currentGame.goldPerTurn = goldPerTurn;
    this.currentGame.sciencePerTurn = sciencePerTurn;
    this.currentGame.culturePerTurn = culturePerTurn;
    
    // Actualizar el oro total (se acumula cada turno)
    this.currentGame.gold += goldPerTurn;
  }

  // Método para procesar las acciones del Worker al final del turno
  private processWorkerActions(game: GameSession): void {
    game.units.forEach(unit => {
      if (unit.type === 'worker' && unit.currentAction && unit.turnsToComplete && unit.turnsToComplete > 0) {
        // Reducir el contador de turnos
        unit.turnsToComplete--;
        
        // Si la tarea se ha completado
        if (unit.turnsToComplete <= 0) {
          const tilePosition = { x: unit.position.x, y: unit.position.y };
          const tile = game.map.tiles[tilePosition.y][tilePosition.x];
          
          // Obtener el servicio de mejoras del terreno
          const tileImprovementService = this.injector.get(TileImprovementService);
          
          // Determinar qué acción se ha completado
          if (unit.currentAction === 'build_road') {
            // Aplicar el camino a la casilla
            tile.hasRoad = true;
            // Reducir el costo de movimiento si hay un camino
            if (tile.movementCost > 1) {
              tile.movementCost = 1;
            }
            console.log(`Trabajador completó la construcción de un camino en (${tile.x}, ${tile.y})`);
            
            // Notificar la actualización del tile
            this.tileUpdateSubject.next({...tile});
          } else if (unit.currentAction && unit.currentAction.startsWith('build_') && unit.currentAction !== 'build_road' as UnitAction) {
            // Para mejoras que no son caminos (granjas, minas, etc.)
            const actionStr = unit.currentAction;
            const improvementType = actionStr.replace('build_', '') as ImprovementType;
            
            // Aplicar la mejora a la casilla
            tileImprovementService.applyImprovement(improvementType, tile);
            console.log(`Trabajador completó la construcción de ${improvementType} en (${tile.x}, ${tile.y})`);
            
            // Notificar la actualización del tile
            this.tileUpdateSubject.next({...tile});
          } else if (unit.currentAction && unit.currentAction.startsWith('clear_')) {
            // Eliminar la característica del terreno
            tileImprovementService.removeFeature(tile);
            console.log(`Trabajador completó la eliminación de característica en (${tile.x}, ${tile.y})`);
            
            // Notificar la actualización del tile
            this.tileUpdateSubject.next({...tile});
          }
          
          // Actualizar la visualización de la casilla
          this.updateTileVisualization(tile);

          // Reiniciar el estado del trabajador
          unit.currentAction = undefined;
          unit.buildingImprovement = undefined;
          unit.turnsToComplete = undefined;
        } else {
          console.log(`Trabajador continúa ${unit.currentAction} - ${unit.turnsToComplete} turnos restantes`);
        }
      }
    });
  }

  // Actualizar la visualización de las casillas al completar mejoras
  updateTileVisualization(tile: MapTile): void {
    // Notificar a los componentes interesados que la visualización de una casilla ha cambiado
    console.log(`Actualizando visualización de casilla (${tile.x}, ${tile.y}) con mejora: ${tile.improvement || 'ninguna'}`);
    
    // Emitir el evento de actualización de casilla
    this.tileUpdateSubject.next(tile);
  }
}
