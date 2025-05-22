import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { City } from './models/city.model';
import * as UnitModel from './models/unit.model';

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



export interface GameOut {
  _id: string;
  user_id: string;
  name: string;
  scenario_id: string;
  created_at: string;
  last_saved: string;
  is_autosave: boolean;
  cheats_used: string[];
  gamesession: string
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
  gamesession: string
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
  GameSession: string
}

export interface EndTurnResponse {
  players: Array<{
    id: string;
    cities: City[];
    units: UnitModel.Unit[];
  }>;
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
    // Serializar gamesession a string si es un objeto
    const payload = {
      ...gameData,
      gamesession: typeof gameData.gamesession === 'string' ? gameData.gamesession : JSON.stringify(gameData.gamesession)
    };
    return this.http.post<GameOut>(`${this.baseUrl}/games`, payload);
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
   * @param gamesession El estado del juego a guardar (objeto o string)
   */
  saveGame(gameId: string, gamesession: any): Observable<GameOut> {
    // Serializar gamesession a string si es un objeto
    const payload = {
      gamesession: typeof gamesession === 'string' ? gamesession : JSON.stringify(gamesession)
    };
    return this.http.post<GameOut>(`${this.baseUrl}/games/${gameId}/save`, payload);
  }

  /**
   * Finaliza el turno del jugador y activa la IA
   * Requiere autenticación con token JWT
   * @param gameId El ID del juego
   * @param playersPayload El payload reducido: { players: [...] }
   */
  endTurn(gameId: string, playersPayload: any): Observable<EndTurnResponse> {
    // Enviar el payload tal cual, sin serializar a string
    return this.http.post<EndTurnResponse>(`${this.baseUrl}/games/${gameId}/endTurn`, playersPayload);
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
