import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MapTile } from './models/map.model';
import { Unit } from './models/unit.model';
import { Player } from './models/player.model';
import { City } from './models/city.model';

export interface GameState {
  currentPlayerId: string;
  players: { [id: string]: Player };
  units: { [id: string]: Unit };
  cities: { [id: string]: City };
  map: {
    width: number;
    height: number;
    tiles: { [id: string]: MapTile };
  };
  turn: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private readonly gameState: GameState = {
    currentPlayerId: '1',
    players: {},
    units: {},
    cities: {},
    map: {
      width: 30,
      height: 20,
      tiles: {}
    },
    turn: 1
  };

  private readonly gameStateSubject = new BehaviorSubject<GameState>(this.gameState);

  constructor() {
    this.initializeGameState();
  }

  private initializeGameState(): void {
    // Aquí iría la lógica para inicializar un nuevo juego
    // Para este ejemplo, dejaremos el estado como está
  }

  observeGameState(): Observable<GameState> {
    return this.gameStateSubject.asObservable();
  }

  getCurrentGameState(): GameState {
    return this.gameState;
  }

  getVisibleTilesForCurrentPlayer(): string[] {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerId];
    return currentPlayer ? currentPlayer.visibleTiles : [];
  }
}
