import { Player } from './player.model';
import { MapTile } from './map.model';
import { City } from './city.model';
import { Unit } from './unit.model';

export type GamePhase = 'setup' | 'playing' | 'ended';
export type GameTurn = 'player' | 'ai';
export type GameDifficulty = 'settler' | 'chieftain' | 'warlord' | 'prince' | 'king' | 'emperor' | 'immortal' | 'deity';

export interface GameState {
  id: string;
  mapWidth: number;
  mapHeight: number;
  currentTurn: number;
  phase: GamePhase;
  currentPlayerIndex: number;
  difficulty: GameDifficulty;
  players: Player[];
  tiles: MapTile[];
  cities: City[];
  units: Unit[];
  winner?: string; // ID del jugador ganador si el juego ha terminado
  winCondition?: string;
}
