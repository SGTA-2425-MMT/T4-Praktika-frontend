import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameMap } from '../models/map.model';
import { Unit } from '../models/unit.model';
import { MapGeneratorService } from './map-generator.service';

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

  constructor(private mapGeneratorService: MapGeneratorService) {
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
    // Unidades iniciales: un colono y un guerrero
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
        position: {
          x: position.x + 1 < 0 ? position.x : position.x + 1,
          y: position.y
        },
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
