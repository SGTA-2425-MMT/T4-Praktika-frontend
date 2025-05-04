import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameMap } from '../models/map.model';
import { Unit } from '../models/unit.model';
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
  cities: City[]; // Añadir array de ciudades
  playerCivilization: string;
  difficulty: string;
  createdAt: Date;
  lastSaved?: Date;
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
    // Cargar partidas guardadas desde localStorage
    this.loadSavedGames();
  }

  get currentGame$(): Observable<GameSession | null> {
    return this.currentGameSubject.asObservable();
  }

  get currentGame(): GameSession | null {
    return this.currentGameSubject.value;
  }

  // Crear una nueva partida con los ajustes proporcionados
  createNewGame(settings: GameSettings): GameSession {
    // Generar dimensiones del mapa según el tamaño seleccionado
    const mapDimensions = this.getMapDimensions(settings.mapSize);
    
    // Generar mapa
    const map = this.mapGeneratorService.generateMap(mapDimensions.width, mapDimensions.height);
    
    // Crear unidades iniciales para el jugador
    const startingPosition = this.findSuitableStartingPosition(map);
    const units = this.createStartingUnits(settings.civilization, startingPosition);
    
    // Crear sesión de juego
    const gameSession: GameSession = {
      id: 'game_' + Date.now(),
      name: settings.gameName,
      turn: 1,
      currentPlayerId: 'player1',
      map,
      units,
      cities: [], // Inicializar el array de ciudades vacío
      playerCivilization: settings.civilization,
      difficulty: settings.difficulty,
      createdAt: new Date()
    };
    
    // Actualizar el estado y guardarlo
    this.currentGameSubject.next(gameSession);
    
    // Revelar las áreas iniciales del mapa
    this.revealInitialMap(gameSession);
    
    return gameSession;
  }

  // Fundar una nueva ciudad con un colono
  foundCity(settler: Unit, cityName: string): City | null {
    const game = this.currentGame;
    if (!game) return null;
    
    // Verificar que el colono pertenece al jugador actual
    if (settler.owner !== game.currentPlayerId || settler.type !== 'settler') {
      return null;
    }
    
    // Crear la ciudad usando el servicio de ciudades
    const newCity = this.cityService.foundCity(
      cityName,
      settler,
      game.map,
      game.turn
    );
    
    // Añadir la ciudad a la lista de ciudades del juego
    game.cities.push(newCity);
    
    // Eliminar el colono después de fundar la ciudad
    game.units = game.units.filter(u => u.id !== settler.id);
    
    // Actualizar la niebla de guerra para revelar el área alrededor de la nueva ciudad
    this.revealAroundCity(game.map, newCity.position, 3);
    
    // Actualizar el estado del juego
    this.currentGameSubject.next({...game});
    
    return newCity;
  }

  private revealAroundCity(map: GameMap, position: {x: number, y: number}, radius: number): void {
    // Usar la misma lógica que para revelar alrededor de unidades
    this.revealAroundUnit(map, position, radius);
  }

  // Cargar una partida guardada
  loadGame(gameId: string): GameSession | null {
    const game = this.savedGames.find(game => game.id === gameId);
    if (game) {
      this.currentGameSubject.next(game);
      return game;
    }
    return null;
  }

  // Guardar la partida actual
  saveGame(): boolean {
    const game = this.currentGame;
    if (!game) return false;
    
    // Actualizar la fecha de guardado
    game.lastSaved = new Date();
    
    // Buscar si ya existe una partida con el mismo ID
    const existingIndex = this.savedGames.findIndex(g => g.id === game.id);
    if (existingIndex >= 0) {
      this.savedGames[existingIndex] = game;
    } else {
      this.savedGames.push(game);
    }
    
    // Guardar en localStorage
    this.persistSavedGames();
    return true;
  }

  // Obtener todas las partidas guardadas
  getSavedGames(): GameSession[] {
    return [...this.savedGames];
  }

  // Eliminar una partida guardada
  deleteGame(gameId: string): boolean {
    const initialLength = this.savedGames.length;
    this.savedGames = this.savedGames.filter(game => game.id !== gameId);
    
    // Si se eliminó alguna partida
    if (this.savedGames.length < initialLength) {
      this.persistSavedGames();
      return true;
    }
    return false;
  }

  // Finalizar turno
  endTurn() {
    const game = this.currentGame;
    if (!game) return;
    
    // Incrementar el turno
    game.turn++;
    
    // Procesar la producción de las ciudades
    this.processCitiesProduction(game);
    
    // Restaurar movimientos de las unidades
    game.units.forEach(unit => {
      if (unit.owner === game.currentPlayerId) {
        unit.movementPoints = unit.maxMovementPoints;
        unit.canMove = true;
      }
    });
    
    // Actualizar el estado del juego
    this.currentGameSubject.next({...game});
  }

  // Método para procesar la producción de todas las ciudades
  private processCitiesProduction(game: GameSession): void {
    game.cities.forEach(city => {
      // Procesar producción solo si hay algo en construcción
      if (city.currentProduction) {
        // Aumentar el progreso de producción
        city.currentProduction.progress += city.productionPerTurn;
        
        // Verificar si la producción se ha completado
        if (city.currentProduction.progress >= city.currentProduction.cost) {
          // Completar la producción
          this.completeProduction(game, city);
        } else {
          // Actualizar los turnos restantes
          city.currentProduction.turnsLeft = Math.ceil(
            (city.currentProduction.cost - city.currentProduction.progress) / city.productionPerTurn
          );
        }
      }
      
      // Procesar el crecimiento de la ciudad (comida, etc.)
      this.processGrowth(city);
    });
  }

  // Método para completar la producción de una ciudad
  private completeProduction(game: GameSession, city: City): void {
    if (!city.currentProduction) return;
    
    // Crear la unidad según el tipo
    if (city.currentProduction.type === 'unit') {
      const unitType = city.currentProduction.id.split('_')[0]; // Obtener el tipo de unidad desde el ID
      
      // Crear la unidad en la casilla de la ciudad
      const newUnit = this.createNewUnit(unitType, city.position, city.ownerId);
      
      if (newUnit) {
        // Añadir la unidad al juego
        game.units.push(newUnit);
        
        console.log(`Ciudad ${city.name} completó la producción de ${city.currentProduction.name}`);
      }
    }
    
    // Limpiar la producción actual
    city.currentProduction = undefined;
  }

  // Método para crear una nueva unidad según su tipo
  private createNewUnit(type: string, position: {x: number, y: number}, owner: string): Unit | null {
    // Generar un ID único
    const id = `${type}_${Date.now()}`;
    
    // Valores base para todas las unidades
    const baseUnit: Unit = {
      id,
      position: {...position},
      owner,
      movementPoints: 0, // Comienza con 0 movimientos cuando se produce
      health: 100,
      maxHealth: 100,
      isRanged: false,
      experience: 0,
      abilities: [],
      canMove: false, // No puede moverse en el turno que se crea
      isFortified: false,
      strength: 0,
      maxMovementPoints: 0,
      name: '',
      type: 'warrior' // Valor por defecto
    };
    
    // Configurar la unidad según su tipo
    switch (type) {
      case 'warrior':
        return {
          ...baseUnit,
          name: 'Guerrero',
          type: 'warrior',
          strength: 5,
          maxMovementPoints: 2
        };
      case 'settler':
        return {
          ...baseUnit,
          name: 'Colono',
          type: 'settler',
          strength: 0,
          maxMovementPoints: 2
        };
      case 'worker':
        return {
          ...baseUnit,
          name: 'Trabajador',
          type: 'worker',
          strength: 0,
          maxMovementPoints: 2
        };
      default:
        console.error(`Tipo de unidad desconocido: ${type}`);
        return null;
    }
  }

  // Procesar el crecimiento de la población
  private processGrowth(city: City): void {
    // Añadir comida producida este turno
    city.food += city.foodPerTurn;
    
    // Verificar si hay suficiente comida para crecer
    if (city.food >= city.foodToGrow) {
      // Incrementar población
      city.population += 1;
      
      // Restar la comida usada para crecer
      city.food -= city.foodToGrow;
      
      // Aumentar el requisito para el siguiente nivel
      city.foodToGrow = Math.floor(city.foodToGrow * 1.5);
      
      console.log(`La ciudad ${city.name} ha crecido a población ${city.population}`);
    }
  }

  // Salir del juego actual
  exitGame() {
    this.currentGameSubject.next(null);
  }

  // Métodos privados de ayuda

  private getMapDimensions(size: string): {width: number, height: number} {
    switch(size) {
      case 'small': return { width: 32, height: 24 };
      case 'medium': return { width: 48, height: 36 };
      case 'large': return { width: 64, height: 48 };
      case 'huge': return { width: 80, height: 60 };
      default: return { width: 48, height: 36 };
    }
  }

  private findSuitableStartingPosition(map: GameMap): {x: number, y: number} {
    // Buscar un lugar adecuado para comenzar (por ejemplo, praderas o llanuras)
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = Math.floor(Math.random() * map.width);
      const y = Math.floor(Math.random() * map.height);
      
      const tile = map.tiles[y][x];
      if (tile.terrain === 'grassland' || tile.terrain === 'plains') {
        return { x, y };
      }
    }
    
    // Si no encontramos un lugar ideal, devolvemos una posición central
    return { 
      x: Math.floor(map.width / 2), 
      y: Math.floor(map.height / 2) 
    };
  }

  private createStartingUnits(civilization: string, position: {x: number, y: number}): Unit[] {
    // Crear un colono y un guerrero como unidades iniciales
    return [
      {
        id: 'settler_1',
        name: 'Colono',
        type: 'settler',
        owner: 'player1',
        position: {...position},
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
        position: {...position}, // Misma posición que el colono inicialmente
        movementPoints: 2,
        maxMovementPoints: 2,
        strength: 5, // Fuerza básica para un guerrero
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
    // Para cada unidad del jugador, revelar las casillas cercanas
    game.units.forEach(unit => {
      if (unit.owner === game.currentPlayerId) {
        this.revealAroundUnit(game.map, unit.position, 3);
      }
    });
  }

  private revealAroundUnit(map: GameMap, position: {x: number, y: number}, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = position.x + dx;
        const y = position.y + dy;
        
        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
          // Verificar si está dentro de un círculo aproximado
          if (Math.sqrt(dx*dx + dy*dy) <= radius) {
            map.tiles[y][x].isExplored = true;
            map.tiles[y][x].isVisible = true;
          }
        }
      }
    }
  }

  private persistSavedGames(): void {
    try {
      // Simplificamos para almacenamiento - en una implementación real
      // usaríamos una solución más robusta
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
}
