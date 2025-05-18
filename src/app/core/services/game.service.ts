import { Building } from './../models/city.model';
import { Building as Building2 } from './../models/building.model';
import { unitLevel } from './../models/unit.model';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { GameMap, MapTile, ImprovementType} from '../models/map.model';
import * as UnitModel from '../models/unit.model';
import { City } from '../models/city.model';
import { MapGeneratorService } from './map-generator.service';
import { CityService } from './city.service';
import { TechnologyService } from './technology.service';
import { TechEra } from '../models/technology.model';
import { TileImprovementService } from './tile-improvement.service';
import { UnitAction } from '../models/unit.model';
import { NotificationService } from './notification.service';
import { SharedWarGameService } from './shared-war-game.service';
import { BuildingsService } from '../services/buildings.service';

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
  unitLevelTracker: UnitModel.unitLevel[];
  cities: City[];
  Buildings: Building2[];
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
  era: 'ancient'  | 'medieval' | 'age_of_discovery' | 'modern';
  players: {
    id: string;
    name: string;
    civilization: string;
    resources: {
      gold: number;
      goldPerTurn: number;
      science: number;
      sciencePerTurn: number;
      culture: number;
      culturePerTurn: number;
      happiness: number;
    };
    research: {
      progress: number;
      turnsRemaining: number;
    };
    technologies: string[];
    availableTechnologies: string[];
    era: 'ancient' | 'medieval' | 'age_of_discovery' | 'modern';
  }[];
  settings: GameSettings; // Agregar los ajustes del juego al estado de la sesión
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
    private sharedWarGameService: SharedWarGameService,
    private mapGeneratorService: MapGeneratorService,
    private cityService: CityService,
    private technologyService: TechnologyService,
    private injector: Injector
  ) {
    this.loadSavedGames();
    // Hacer que el servicio sea accesible globalmente para llamarlo desde cualquier componente
    // Esto es una solución temporal, en una aplicación real usaríamos un enfoque más adecuado
    (window as any).gameServiceInstance = this;
  }

  // Getter para el servicio de edificios
  get buildingsService(): BuildingsService {
    return this.injector.get(BuildingsService);
  }

  // Obtener el servicio de notificación usando Injector para evitar dependencia circular
  private get notificationService() {
    return this.injector.get(NotificationService);
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
      unitLevelTracker: UnitModel.UNIT_LEVEL_TRACKER,
      cities: [],
      Buildings: [],
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
      era: 'ancient',
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          civilization: settings.civilization,
          resources: {
            gold: 0,
            goldPerTurn: 0,
            science: 0,
            sciencePerTurn: 0,
            culture: 0,
            culturePerTurn: 0,
            happiness: 0
          },
          research: {
            progress: 0,
            turnsRemaining: 0
          },
          technologies: [],
          availableTechnologies: [],
          era: 'ancient'
        }
      ],
      settings // Almacenar los ajustes del juego en el estado de la sesión
    };

    this.currentGameSubject.next(gameSession);

    this.revealInitialMap(gameSession);
    this.createRivalCivilizations();

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

    // Buscar todas las buildings al final del turno
    const allBuildings = this.currentGame.Buildings;


    for (const building of allBuildings) {
      if (building.turnsToBuild>0)
      {
        building.turnsToBuild--;
      }
      else if (building.turnsToBuild === 0 && !building.built) {
        building.built = true;
        game.map.tiles[building.position.y][building.position.x].building = building.type;
      }
    }

    // Actualizar ciencia acumulada y progreso de investigación
    this.updateResearch();

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
    const game = this.currentGame;
    if (!game) return;

    game.units
      .filter(unit => unit.owner !== game.currentPlayerId && unit.owner !== 'neutral')
      .forEach(rivalUnit => {
        // Encontrar la unidad enemiga más cercana
        const nearestEnemy = game.units
          .filter(unit => unit.owner === game.currentPlayerId)
          .reduce((closest: UnitModel.Unit | null, current: UnitModel.Unit) => {
            const distanceToCurrent = Math.abs(rivalUnit.position.x - current.position.x) +
                                      Math.abs(rivalUnit.position.y - current.position.y);
            const distanceToClosest = closest ? Math.abs(rivalUnit.position.x - closest.position.x) +
                                               Math.abs(rivalUnit.position.y - closest.position.y) : Infinity;
            return distanceToCurrent < distanceToClosest ? current : closest;
          }, null);

        if (nearestEnemy) {
          const dx = Math.sign(nearestEnemy.position.x - rivalUnit.position.x);
          const dy = Math.sign(nearestEnemy.position.y - rivalUnit.position.y);

          // Moverse un casillero hacia el enemigo más cercano
          rivalUnit.position.x += dx;
          rivalUnit.position.y += dy;

          // Atacar si está en rango
          if (this.isUnitInRange(rivalUnit, nearestEnemy)) {
            this.attackUnit(rivalUnit, nearestEnemy);
          }
        }
      });
  }

  attackUnit(attacker: UnitModel.Unit, defender: UnitModel.Unit): boolean {
    return this.sharedWarGameService.attackUnit(attacker, defender);
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

            if ((unit.type === 'warrior' || unit.type === 'archer' || unit.type ==='artillery'
                || unit.type === 'horseman' || unit.type === 'galley' || unit.type === 'rifleman' || unit.type === 'tank' || unit.type === 'warship'
                || unit.type === 'catapult' ) ) {
                const enemyUnitsInRange = game.units.some(otherUnit =>
                    otherUnit.owner !== game.currentPlayerId && // Asegurarse de que no sea del jugador actual
                    otherUnit.owner !== 'neutral' && // Excluir unidades neutrales
                    this.isUnitInRange(unit, otherUnit)
                );

                if (enemyUnitsInRange) {
                    availableActions.push('attack');
                }
            }

            unit.availableActions = availableActions;
        }
    });
  }

  isUnitInRange(attacker: UnitModel.Unit, target: UnitModel.Unit): boolean {
    return this.sharedWarGameService.isUnitInRange(attacker, target);
  }

  updateResearch(): void {
    const game = this.currentGame;
    if (!game) return;

    console.log('=== Actualizando investigación ===');
    // Recalcular la ciencia por turno antes de actualizar la investigación
    // Esto asegura que estamos usando los valores más actualizados
    this.calculatePlayerResources();

    // Verificar la ciencia por ciudades
    console.log('Contribuciones científicas por ciudad:');
    let totalCalculatedScience = 0;
    game.cities.forEach(city => {
      if (city.ownerId === game.currentPlayerId) {
        console.log(`  ${city.name}: ${city.sciencePerTurn} (Científicos: ${city.citizens.scientists})`);
        totalCalculatedScience += city.sciencePerTurn;
      }
    });

    // Esto debería coincidir con game.sciencePerTurn
    console.log(`Ciencia calculada manualmente: ${totalCalculatedScience}`);
    console.log(`Ciencia en el estado del juego: ${game.sciencePerTurn}`);

    // Si hay discrepancia, corregir
    if (totalCalculatedScience !== game.sciencePerTurn) {
      console.log('¡DISCREPANCIA DETECTADA! Corrigiendo...');
      game.sciencePerTurn = totalCalculatedScience;
    }

    // Sincronizar el estado de investigación entre GameService y TechnologyService
    this.technologyService.syncResearchWithGame(game.researchProgress);

    // Añadir la ciencia generada por turno a la ciencia acumulada
    game.science += game.sciencePerTurn;
    console.log(`Ciencia acumulada: ${game.science} (+${game.sciencePerTurn} este turno)`);

    // Si hay una investigación en progreso, actualizar su avance
    if (game.researchProgress) {
      // Actualizar el progreso con la ciencia generada este turno usando TechnologyService
      // Esto mantiene la coherencia entre los dos servicios
      const completedTech = this.technologyService.updateResearchProgress(game.sciencePerTurn);

      console.log(`Progreso de investigación: ${game.researchProgress.progress}/${game.researchProgress.totalCost} (${game.sciencePerTurn} añadidos este turno)`);

      // Si la investigación se completó, actualizar el estado del juego
      if (completedTech) {
        const completedTechnology = game.researchProgress.currentTechnology;
        console.log(`[GameService] Investigación completada de tecnología: ${completedTechnology}`);

        //halo aqui!!!!
        // Desbloquear construcciones asociadas a la tecnología
        if (completedTech.unlocksBuildings && completedTech.unlocksBuildings.length > 0) {
          const unlockableTypes = ['road', 'port', 'farm', 'gold_mine'];
          completedTech.unlocksBuildings.forEach(buildingType => {
            if (unlockableTypes.includes(buildingType)) {
              // Buscar el template correspondiente y marcarlo como unlocked
              const template = this.buildingsService.getAll().find(b => b.type === buildingType);
              if (template) {
                template.unlocked = true;
                console.log(`[GameService] Construcción desbloqueada: ${template.name}`);
              }
            }
          });
        }

        // Mejorar nivel de unidades desbloqueadas por la tecnología
        if (completedTech.unlocksUnits && completedTech.unlocksUnits.length > 0) {
          completedTech.unlocksUnits.forEach(unitType => {
            const trackerEntry = game.unitLevelTracker.find(u => String(u.unitType) === String(unitType));
            if (trackerEntry) {
              // Sube el nivel hasta un máximo de 2
              console.log(`[GameService] Nivel de unidad actual: ${trackerEntry.unitLevel}`);
              trackerEntry.unitLevel = Math.min(Number(trackerEntry.unitLevel) + 1, 2);
              console.log(`[GameService] Nivel de unidad '${unitType}' mejorado a ${trackerEntry.unitLevel}`);
            }
          });
        }

        // Verificar si la tecnología ya está en la lista para evitar duplicados
        if (!game.discoveredTechnologies.includes(completedTechnology)) {
          console.log(`[GameService] Añadiendo nueva tecnología a descubiertas: ${completedTechnology}`);
          game.discoveredTechnologies.push(completedTechnology);

          this.updateAvailableTechnologies();
          console.log(`[GameService] Lista de tecnologías disponibles actualizada`);

          // Información detallada sobre la tecnología completada
          console.log(`[GameService] Detalles de tecnología completada:`);
          console.log(`  - Nombre: ${completedTech.name}`);
          console.log(`  - Edificios desbloqueados: ${completedTech.unlocksBuildings?.join(', ') ?? 'ninguno'}`);
          console.log(`  - Unidades desbloqueadas: ${completedTech.unlocksUnits?.join(', ') ?? 'ninguna'}`);

          // Notificar al jugador que la investigación se ha completado usando el sistema de notificaciones
          // Solo mostrar notificación si es la primera vez que se descubre
          try {
            console.log(`[GameService] Intentando mostrar notificación de investigación completada`);
            const notificationId = this.notificationService.researchComplete(
              completedTech.name,
              completedTech.unlocksBuildings || [],
              completedTech.unlocksUnits || []
            );
            console.log(`[GameService] Notificación mostrada con ID: ${notificationId}`);
          } catch (e) {
            console.error('[GameService] Error al mostrar notificación:', e);
          }
        } else {
          console.log(`[GameService] La tecnología ya estaba descubierta: ${completedTechnology}`);
        }

        // Limpiar la investigación actual
        console.log(`[GameService] Limpiando investigación actual`);
        game.researchProgress = undefined;
      } else if (game.researchProgress) {
        // Actualizar los turnos restantes
        game.researchProgress.turnsLeft = Math.ceil(
          (game.researchProgress.totalCost - game.researchProgress.progress) / Math.max(1, game.sciencePerTurn)
        );
      }
    }

    // Asegurar que se conserven los valores actualizados
    // y que se propague la notificación de cambio
    this.currentGameSubject.next({...game});
    console.log('=== Investigación actualizada ===');
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
    const unitLevel = this.getUnitLevelByType(type); // Usar el método actualizado
    if (!unitLevel || unitLevel < 1) {
      console.error(`No se puede desarrollar unidad no desbloqueada: ${type}`);
      return null;
    }
    switch (type) {
      case 'warrior':
        return UnitModel.createWarrior(owner , position.x, position.y, unitLevel);
      case 'settler':
        return UnitModel.createSettler(owner , position.x, position.y, unitLevel);
      case 'worker':
        return UnitModel.createWorker(owner , position.x, position.y, unitLevel);
      case 'archer':
        return UnitModel.createArcher(owner , position.x, position.y, unitLevel);
      case 'horseman':
        return UnitModel.createHorseman(owner , position.x, position.y, unitLevel);
      case 'catapult':
        return UnitModel.createCatapult(owner , position.x, position.y, unitLevel); // Si hay un createSwordsman, cámbialo aquí
      case 'artillery':
        return UnitModel.createArtillery(owner , position.x, position.y, unitLevel);
      case 'galley':
        return UnitModel.createGalley(owner , position.x, position.y, unitLevel);
      case 'tank':
        return UnitModel.createTank(owner , position.x, position.y, unitLevel);
      case 'rifleman':
        return UnitModel.createRifleman(owner , position.x, position.y, unitLevel);
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
      // Verificar que el terreno sea adecuado Y no tenga bosque/jungla
      if ((tile.terrain === 'grassland' || tile.terrain === 'plains') &&
          tile.featureType !== 'forest' && tile.featureType !== 'jungle') {
        console.log(`Posición inicial encontrada en (${x}, ${y}), terreno: ${tile.terrain}, característica: ${tile.featureType ?? 'ninguna'}`);
        return { x, y };
      }
    }

    console.warn('No se encontró una posición inicial adecuada después de 100 intentos. Usando posición central.');
    return {
      x: Math.floor(map.width / 2),
      y: Math.floor(map.height / 2)
    };
  }

  private createStartingUnits(civilization: string, position: { x: number; y: number }): UnitModel.Unit[] {
    const settler = UnitModel.createSettler('player1', position.x, position.y, 1);
    const owner = 'player1';
    const warrior = UnitModel.createWorker(owner , position.x, position.y, 1);
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
    const newEra = this.technologyService.getGameEra(game);
    if (game.era !== this.convertTechEraToGameEra(newEra)) {
      const oldEra = game.era;
      game.era = this.convertTechEraToGameEra(newEra);
      console.log(`¡La civilización ha avanzado de la era ${oldEra} a la era ${game.era}!`);
    }
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
  private convertTechEraToGameEra(techEra: TechEra): 'ancient' | 'medieval' | 'age_of_discovery' | 'modern' {
    switch (techEra) {
      case TechEra.ANCIENT:
        return 'ancient';
      case TechEra.MEDIEVAL:
        return 'medieval';
      case TechEra.AGE_OF_DISCOVERY:
        return 'age_of_discovery';
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
      // Verificar si hay cambios en los científicos para depuración
      const oldCity = this.currentGame.cities[cityIndex];
      if (oldCity.citizens.scientists !== city.citizens.scientists) {
        console.log(`Cambio en científicos en ${city.name}: ${oldCity.citizens.scientists} → ${city.citizens.scientists}`);
        console.log(`Ciencia esperada: ${city.citizens.scientists * 2 + 1} (base 1 + científicos)`);
      }

      // Actualizar la ciudad
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

    console.log('=== Procesando ciudades al final del turno ===');
    console.log(`Ciencia actual: ${this.currentGame.sciencePerTurn} por turno`);

    // Para cada ciudad del jugador
    this.currentGame.cities.forEach(city => {
      if (city.ownerId === this.currentGame!.currentPlayerId) {
        console.log(`Ciudad: ${city.name}, Científicos: ${city.citizens.scientists}, Ciencia: ${city.sciencePerTurn}`);

        // Actualizar crecimiento de población
        this.cityService.growCity(city);

        // Actualizar producción de edificios
        this.cityService.updateBuildingProduction(city, this.currentGame!.turn);

        // Actualizar rendimientos de la ciudad
        this.cityService.refreshCityBuildingEffects(city);

        // Asegurar que las contribuciones de los científicos se apliquen
        // Esto calcula la ciencia por científico y la añade a la base
        this.cityService.updateCityYieldsBasedOnCitizens(city);

        // Procesar recursos de edificios
        const buildingResources = this.buildingsService.processTurn(city.id);
        city.foodPerTurn += buildingResources.food;
        city.goldPerTurn += buildingResources.gold;

        console.log(`Después de actualizar: Ciudad ${city.name}, Científicos: ${city.citizens.scientists}, Ciencia: ${city.sciencePerTurn}`);
      }
    });

    // Recalcular los recursos totales del jugador sumando de todas las ciudades
    let oldSciencePerTurn = this.currentGame.sciencePerTurn;
    this.calculatePlayerResources();
    console.log(`Ciencia recalculada: ${oldSciencePerTurn} → ${this.currentGame.sciencePerTurn} por turno`);
    console.log('=======================================');
  }

  // Calcular recursos totales del jugador
  calculatePlayerResources(): void {
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

    // No acumulamos el oro en este método para evitar acumulación duplicada
    // Notificar los cambios
    this.currentGameSubject.next({...this.currentGame});
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
            console.log(`Trabajador completó la construcción de ${improvementType} en (${tile.x}, ${tile.y})`);

            // Notificar la actualización del tile
            this.tileUpdateSubject.next({...tile});
          } else if (unit.currentAction?.startsWith('clear_')) {
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
    console.log(`Actualizando visualización de casilla (${tile.x}, ${tile.y}) con mejora: ${tile.building || 'none'}`);

    // Emitir el evento de actualización de casilla
    this.tileUpdateSubject.next(tile);
  }

  // Actualizar el estado del juego forzando una emisión del BehaviorSubject
  updateGame(): void {
    if (!this.currentGame) return;

    // Crear una copia del objeto para asegurar que se detecten los cambios
    const updatedGame = {...this.currentGame};
    this.currentGameSubject.next(updatedGame);
    console.log('Estado del juego actualizado manualmente');
  }

  // Devuelve el nivel de una unidad según su tipo usando el tracker
  getUnitLevelByType(unitType: string): number {
    const game = this.currentGame;
    if (!game) return 0;
    // Permitir que unitType sea string o UnitType, normalizando a string
    const entry = game.unitLevelTracker.find(u => String(u.unitType) === String(unitType));
    return entry ? Number(entry.unitLevel) : 0;
  }

  private createRivalCivilizations(): void {
    const game = this.currentGame;
    if (!game) return;

    // Inicializar la lista de jugadores si no está definida
    if (!game.players) {
        game.players = [];
    }

    const availableCivilizations = [
        'aztecs', 'egyptians', 'romans', 'greeks', 'chinese', 'indians', 'japanese', 'mongols'
    ];

    for (let i = 0; i < game.settings.numberOfOpponents; i++) {
        const civilization = availableCivilizations[i % availableCivilizations.length];
        const rivalId = `rival${i + 1}`;
        const rivalName = `Civilización ${i + 1}`;

        const startingPosition = this.findSuitableStartingPosition(game.map);

        // Crear una ciudad inicial para la civilización rival
        const settler = UnitModel.createSettler(rivalId, startingPosition.x, startingPosition.y, 1);
        const city = this.cityService.foundCity(
            `Ciudad ${rivalName}`,
            settler,
            game.map,
            game.turn
        );

        if (city) {
            city.ownerId = rivalId;
            game.cities.push(city);
        }

        // Crear unidades iniciales para la civilización rival
        const units = [
            UnitModel.createWarrior(rivalId, startingPosition.x, startingPosition.y, 1),
            UnitModel.createArcher(rivalId, startingPosition.x, startingPosition.y, 1)
        ];

        game.units.push(...units);

        // Añadir la civilización rival al estado del juego
        game.players.push({
            id: rivalId,
            name: rivalName,
            civilization: civilization,
            resources: {
                gold: 50,
                goldPerTurn: 2,
                science: 0,
                sciencePerTurn: 1,
                culture: 0,
                culturePerTurn: 1,
                happiness: 0
            },
            research: {
                progress: 0,
                turnsRemaining: 0
            },
            technologies: [],
            availableTechnologies: ['agriculture', 'mining', 'sailing'],
            era: 'ancient'
        });
    }

    this.currentGameSubject.next({ ...game });
  }
}
