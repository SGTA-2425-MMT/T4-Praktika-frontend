import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, GameOut, PlayerAction } from '../api.service';
import { NotificationService } from './notification.service';
import { GameService } from './game.service';

/**
 * Servicio para manejar las acciones del jugador y su comunicación con la API.
 * Este servicio se encarga de enviar las acciones del jugador al backend y
 * actualizar el estado del juego en consecuencia.
 */
@Injectable({
  providedIn: 'root'
})
export class PlayerActionService {
  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private gameService: GameService
  ) {}

  /**
   * Mueve una unidad a una nueva posición
   * @param unitId ID de la unidad
   * @param destination Destino {x, y}
   */
  async moveUnit(unitId: string, destination: { x: number, y: number }): Promise<boolean> {
    const action: PlayerAction = {
      type: 'moveUnit',
      details: {
        unitId,
        destination
      }
    };

    return this.executeAction(action);
  }

  /**
   * Construye una estructura en una ciudad
   * @param cityId ID de la ciudad
   * @param structureType Tipo de estructura
   */
  async buildStructure(cityId: string, structureType: string): Promise<boolean> {
    const action: PlayerAction = {
      type: 'buildStructure',
      details: {
        cityId,
        structureType
      }
    };

    return this.executeAction(action);
  }

  /**
   * Entrena una unidad en una ciudad
   * @param cityId ID de la ciudad
   * @param unitType Tipo de unidad
   * @param quantity Cantidad (por defecto 1)
   */
  async trainUnit(cityId: string, unitType: string, quantity: number = 1): Promise<boolean> {
    const action: PlayerAction = {
      type: 'trainUnit',
      details: {
        cityId,
        unitType,
        quantity
      }
    };

    return this.executeAction(action);
  }

  /**
   * Mejora un recurso
   * @param resourceType Tipo de recurso
   */
  async improveResource(resourceType: string): Promise<boolean> {
    const action: PlayerAction = {
      type: 'improveResource',
      details: {
        resourceType
      }
    };

    return this.executeAction(action);
  }

  /**
   * Investiga una tecnología
   * @param technology Tecnología a investigar
   */
  async researchTechnology(technology: string): Promise<boolean> {
    const action: PlayerAction = {
      type: 'researchTechnology',
      details: {
        technology
      }
    };

    return this.executeAction(action);
  }

  /**
   * Funda una ciudad
   * @param unitId ID de la unidad colonizadora
   * @param location Ubicación {x, y}
   */
  async foundCity(unitId: string, location: { x: number, y: number }): Promise<boolean> {
    const action: PlayerAction = {
      type: 'foundCity',
      details: {
        unitId,
        location
      }
    };

    return this.executeAction(action);
  }

  /**
   * Ataca a un enemigo
   * @param unitId ID de la unidad atacante
   * @param location Ubicación del objetivo {x, y}
   */
  async attackEnemy(unitId: string, location: { x: number, y: number }): Promise<boolean> {
    const action: PlayerAction = {
      type: 'attackEnemy',
      details: {
        unitId,
        location
      }
    };

    return this.executeAction(action);
  }

  /**
   * Finaliza el turno del jugador y activa la IA
   */
  async endTurn(): Promise<boolean> {
    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      console.error('No hay juego activo para finalizar turno');
      return false;
    }

    try {
      // Mostrar indicador de carga
      this.notificationService.info('Turno IA', 'Procesando turno de la IA...', { duration: 0 });

      // Enviar la solicitud de finalizar turno a la API
      const updatedGame = await firstValueFrom(this.apiService.endTurn(currentGame.id));

      // Actualizar el estado del juego local con el nuevo estado recibido
      await this.gameService.loadGameFromApi(currentGame.id);

      this.notificationService.success('Nuevo turno', 'Comienza tu turno');
      return true;
    } catch (error) {
      console.error('Error al finalizar turno:', error);
      this.notificationService.error('Error', 'No se pudo finalizar el turno');
      return false;
    }
  }

  /**
   * Ejecuta una acción genérica del jugador
   * @param action Acción a ejecutar
   */
  private async executeAction(action: PlayerAction): Promise<boolean> {
    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      console.error('No hay juego activo para realizar la acción');
      return false;
    }

    try {
      console.log(`Ejecutando acción: ${action.type}`, action.details);

      // Enviar la acción a la API
      const updatedGame = await firstValueFrom(
        this.apiService.applyAction(currentGame.id, action)
      );

      // Actualizar el estado del juego local con el nuevo estado recibido
      await this.gameService.loadGameFromApi(currentGame.id);

      return true;
    } catch (error) {
      console.error(`Error al ejecutar acción ${action.type}:`, error);
      this.notificationService.error('Error', `No se pudo realizar la acción: ${action.type}`);
      return false;
    }
  }

  /**
   * Ejecuta múltiples acciones en una sola petición
   * @param actions Lista de acciones a ejecutar
   */
  async executeMultipleActions(actions: PlayerAction[]): Promise<boolean> {
    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      console.error('No hay juego activo para realizar acciones');
      return false;
    }

    try {
      console.log(`Ejecutando ${actions.length} acciones:`, actions);

      // Enviar las acciones a la API
      const updatedGame = await firstValueFrom(
        this.apiService.applyAction(currentGame.id, actions)
      );

      // Actualizar el estado del juego local con el nuevo estado recibido
      await this.gameService.loadGameFromApi(currentGame.id);

      return true;
    } catch (error) {
      console.error(`Error al ejecutar acciones múltiples:`, error);
      this.notificationService.error('Error', 'No se pudieron realizar las acciones');
      return false;
    }
  }
}
