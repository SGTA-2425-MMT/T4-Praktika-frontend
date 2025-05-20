import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces para los modelos de datos
export interface MapSize {
  width: number;
  height: number;
}

export interface GameMap {
  size: MapSize;
  explored: number[][];
  visible_objects: any[];
  stored_tiles?: any[][]; // Para guardar los datos completos de las casillas
}

export interface GameStatePlayer {
  cities: any[];
  units: any[];
  technologies: any[];
  resources: Record<string, any>;
}

export interface GameState {
  turn: number;
  current_player: string;
  player: GameStatePlayer;
  ai: GameStatePlayer;
  map: GameMap;
}

export interface GameOut {
  _id: string;
  user_id: string;
  name: string;
  scenario_id: string;
  created_at: string;
  last_saved: string;
  is_autosave: boolean;
  cheats_used: string[];
  game_state: GameState;
}

export interface ScenarioOut {
  _id: string;
  name: string;
  description: string;
  map_size: MapSize;
  difficulty: string;
  created_at: string;
}

export interface GameCreate {
  name: string;
  scenario_id: string;
  game_state: GameState;
}

export interface PlayerAction {
  type: string;
  details: any;
}

export interface CheatRequest {
  game_id: string;
  cheat_code: string;
  target?: {
    type: string;
    id: string;
  };
}

export interface CheatResponse {
  message: string;
  success: boolean;
  game_state?: GameState;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) { }

  // ===== ESCENARIOS =====
  /**
   * Obtiene todos los escenarios disponibles
   * No requiere autenticación
   */
  getScenarios(): Observable<ScenarioOut[]> {
    return this.http.get<ScenarioOut[]>(`${this.baseUrl}/scenarios`);
  }

  // ===== JUEGOS =====
  /**
   * Obtiene todos los juegos del usuario actual
   * Requiere autenticación con token JWT
   */
  getGames(): Observable<GameOut[]> {
    return this.http.get<GameOut[]>(`${this.baseUrl}/games`);
  }

  /**
   * Crea un nuevo juego
   * Requiere autenticación con token JWT
   * @param gameData Los datos para el nuevo juego
   */
  createGame(gameData: GameCreate): Observable<GameOut> {
    return this.http.post<GameOut>(`${this.baseUrl}/games`, gameData);
  }

  /**
   * Obtiene un juego específico por su ID
   * Requiere autenticación con token JWT
   * @param gameId El ID del juego a obtener
   */
  getGame(gameId: string): Observable<GameOut> {
    return this.http.get<GameOut>(`${this.baseUrl}/games/${gameId}`);
  }

  /**
   * Guarda el estado actual de un juego
   * Requiere autenticación con token JWT
   * @param gameId El ID del juego a guardar
   * @param gameState El estado del juego a guardar
   */
  saveGame(gameId: string, gameState: GameState): Observable<GameOut> {
    return this.http.post<GameOut>(`${this.baseUrl}/games/${gameId}/save`, gameState);
  }

  /**
   * Aplica una acción del jugador
   * Requiere autenticación con token JWT
   * @param gameId El ID del juego
   * @param action La acción a realizar
   */
  applyAction(gameId: string, action: PlayerAction | PlayerAction[]): Observable<GameOut> {
    return this.http.post<GameOut>(`${this.baseUrl}/games/${gameId}/action`, action);
  }

  /**
   * Finaliza el turno del jugador y activa la IA
   * Requiere autenticación con token JWT
   * @param gameId El ID del juego
   */
  endTurn(gameId: string): Observable<GameOut> {
    return this.http.post<GameOut>(`${this.baseUrl}/games/${gameId}/endTurn`, {});
  }

  /**
   * Aplica un cheat code al juego
   * Requiere autenticación con token JWT
   * @param gameId El ID del juego
   * @param cheatRequest Los datos del cheat
   */
  applyCheat(gameId: string, cheatRequest: CheatRequest): Observable<CheatResponse> {
    return this.http.post<CheatResponse>(`${this.baseUrl}/games/${gameId}/cheat`, cheatRequest);
  }

  /**
   * Elimina un juego específico por su ID
   * Requiere autenticación con token JWT
   * @param gameId El ID del juego a eliminar
   */
  deleteGame(gameId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/games/${gameId}`);
  }
}
