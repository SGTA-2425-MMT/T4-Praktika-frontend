import { Injectable } from '@angular/core';
import { GameService } from './game.service';
import { MapService } from './map.service';
import { FogOfWarService } from './fog-of-war.service';
import { NotificationService } from './notification.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { BuildingCategory, Era, City } from '../models/city.model';
import * as UnitModel from '../models/unit.model';
import { GameSession } from './game.service';
import { TechnologyService } from './technology.service';
import { TechEra } from '../models/technology.model';
import { ApiService, CheatRequest } from '../api.service';

export interface CheatLogEntry {
  code: string;
  timestamp: Date;
  result: string;
  contextData?: any;
}

@Injectable({
  providedIn: 'root',
})
export class CheatService {
  private cheatsEnabled = false; // Por defecto, los trucos están desactivados
  private cheatLogs: CheatLogEntry[] = [];

  // Observable para notificar cuando los trucos están habilitados/deshabilitados
  private cheatsEnabledSubject = new BehaviorSubject<boolean>(this.cheatsEnabled);
  public cheatsEnabled$ = this.cheatsEnabledSubject.asObservable();

  constructor(
    private gameService: GameService,
    private mapService: MapService,
    private fogOfWarService: FogOfWarService,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    console.log(`Modo de trucos ${this.cheatsEnabled ? 'activado' : 'desactivado'}`);
  }

  /**
   * Permite activar o desactivar el sistema de trucos
   */
  setCheatMode(enabled: boolean): void {
    this.cheatsEnabled = enabled;
    this.cheatsEnabledSubject.next(enabled);
    console.log(`Modo de trucos ${enabled ? 'activado' : 'desactivado'}`);
    this.logCheatUse('system', `Modo de trucos ${enabled ? 'activado' : 'desactivado'}`, { systemAction: true });
  }

  /**
   * Verifica si el modo de trucos está habilitado
   */
  isCheatModeEnabled(): boolean {
    return this.cheatsEnabled;
  }

  /**
   * Ejecuta un truco específico basado en el código proporcionado
   */
  executeCheat(code: string, context: any): string {
    // Si los trucos estaban desactivados y se introduce un comando, activarlos automáticamente
    if (!this.cheatsEnabled) {
      this.setCheatMode(true);
      console.log('Modo de trucos activado automáticamente.');
    }

    // Validar contexto del juego
    if (!this.validateGameContext(context)) {
      const message = 'Contexto de juego inválido o insuficiente para ejecutar trucos';
      this.logCheatUse(code, message, context);
      return message;
    }

    let result = '';

    // Verificar si el comando incluye parámetros en formato código:parámetro
    const cmdParts = code.split(':');
    const baseCommand = cmdParts[0];

    // Si hay parámetros en el formato "código:parámetro", añadirlos al contexto
    if (cmdParts.length > 1) {
      context.command = code; // Guardamos el comando completo
      code = baseCommand; // Para el switch usamos solo la parte principal
    }

    switch (code) {
      case 'eraiki_guztiak':
        result = this.buildAll(context);
        break;
      case 'berehalako_porrota':
        result = this.instantDefeat(context);
        break;
      case 'berehalako_garaipena':
        result = this.instantVictory(context);
        break;
      case 'tanke_eskuadroia':
        result = this.addTankSquad(context);
        break;
      case 'teknologia_aurreratua':
        result = this.giveAdvancedTech(context);
        break;
      case 'maila_igo':
        result = this.levelUpCity(context);
        break;
      case 'baliabide_maximoak':
        result = this.maximizeResources(context);
        break;
      case 'mugimendu_infinitua':
        result = this.enableInfiniteMovement(context);
        break;
      case 'zorion_maximoa':
        result = this.maximizeHappiness(context);
        break;
      case 'mapa_agertu':
        result = this.revealMap(context);
        break;
      case 'help':
        result = this.getCheatHelp();
        break;
      default:
        result = 'Código de truco no reconocido. Escribe "help" para ver los trucos disponibles.';
        break;
    }

    // Registrar el uso del truco para depuración
    this.logCheatUse(code, result, context);

    return result;
  }

  /**
   * Ejecuta un cheat a través de la API del backend
   * @param cheatCode El código del cheat a ejecutar
   * @param target El objetivo opcional del cheat
   */
  async executeCheatAPI(cheatCode: string, target?: { type: string, id: string }): Promise<boolean> {
    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      this.notificationService.error('Error', 'No hay juego activo para aplicar la trampa');
      return false;
    }

    // Crear el objeto de solicitud de trampa
    const cheatRequest: CheatRequest = {
      game_id: currentGame.id,
      cheat_code: cheatCode,
      target: target
    };

    try {
      // Enviar la solicitud a la API
      const response = await firstValueFrom(this.apiService.applyCheat(currentGame.id, cheatRequest));

      // Si la trampa fue exitosa y devolvió un nuevo estado del juego, actualizarlo
      if (response.success) {
        // Recargar el juego para aplicar los cambios
        await this.gameService.loadGameFromApi(currentGame.id);
      }

      // Mostrar mensaje de éxito o error
      if (response.success) {
        this.notificationService.success('Trampa aplicada', response.message || 'Trampa aplicada correctamente');
        // Registrar el uso del cheat
        this.logCheatUse(cheatCode, response.message || 'Trampa aplicada correctamente', {
          target,
          apiResponse: true
        });
      } else {
        this.notificationService.error('Error', response.message || 'La trampa no tuvo efecto');
      }

      return response.success;
    } catch (error) {
      console.error('Error al aplicar trampa:', error);
      this.notificationService.error('Error', 'No se pudo aplicar la trampa');
      return false;
    }
  }

  /**
   * Método para identificar si un cheat debe ejecutarse en el backend o frontend
   * @param code El código del cheat
   * @param context El contexto de ejecución
   */
  async processCheat(code: string, context: any): Promise<string> {
    // Cheats que se ejecutan en el backend
    const backendCheats = [
      'recursos_infinitos',
      'investigacion_completa',
      'matar_IA',
      'conquistar_mundo',
      'oro_infinito',
      'unidades_max_nivel'
    ];

    // Verificar si el cheat debería ejecutarse en el backend
    const cmdParts = code.split(':');
    const baseCommand = cmdParts[0];

    if (backendCheats.includes(baseCommand)) {
      // Para cheats de backend, extraer el target si existe
      let target;
      if (cmdParts.length > 1) {
        const targetParam = cmdParts[1].trim();
        // Analizar el target, por ejemplo "city:city_123" o "unit:unit_456"
        const targetParts = targetParam.split(':');
        if (targetParts.length === 2) {
          target = {
            type: targetParts[0],
            id: targetParts[1]
          };
        }
      }

      // Ejecutar en el backend
      const success = await this.executeCheatAPI(baseCommand, target);
      return success
        ? `Trampa "${baseCommand}" ejecutada correctamente en el servidor`
        : `Error al ejecutar la trampa "${baseCommand}" en el servidor`;
    } else {
      // Para cheats de frontend, usar la implementación local
      return this.executeCheat(code, context);
    }
  }

  /**
   * Valida que el contexto proporcionado tenga los datos mínimos necesarios
   */
  private validateGameContext(context: any): boolean {
    // Verificar que existe un contexto y que contiene información básica del juego
    return context && context.gameId && this.gameService.currentGame !== null;
  }

  /**
   * Registra el uso de un truco en el log
   */
  private logCheatUse(code: string, result: string, context?: any): void {
    const entry: CheatLogEntry = {
      code,
      timestamp: new Date(),
      result,
      contextData: context ? { ...context } : undefined
    };

    this.cheatLogs.push(entry);

    // Log para consola con formato especial para identificar fácilmente
    console.log(`%c[CHEAT] ${entry.timestamp.toISOString()} - Código: ${code} - Resultado: ${result}`,
                'color: #ff5722; font-weight: bold;');
  }

  /**
   * Devuelve todos los logs de trucos registrados
   */
  getCheatLogs(): CheatLogEntry[] {
    return [...this.cheatLogs];
  }

  /**
   * Propiedad para acceder a los logs desde plantillas
   */
  get logs(): CheatLogEntry[] {
    return [...this.cheatLogs];
  }

  /**
   * Exporta los logs a un formato JSON que puede descargarse
   */
  exportCheatLogs(): string {
    const logsJson = JSON.stringify(this.cheatLogs, null, 2);
    return logsJson;
  }

  /**
   * Limpia el historial de logs
   */
  clearCheatLogs(): void {
    this.cheatLogs = [];
    console.log('Historial de trucos limpiado');
  }

  /**
   * Proporciona ayuda sobre los trucos disponibles
   */
  private getCheatHelp(): string {
    return `
      Trucos disponibles:
      - eraiki_guztiak: Construye todos los edificios en la ciudad
        Uso: eraiki_guztiak (si solo tienes una ciudad)
        Uso: eraiki_guztiak:NOMBRE_CIUDAD (si tienes varias ciudades)
      - berehalako_porrota: Derrota inmediata
      - berehalako_garaipena: Victoria inmediata
      - tanke_eskuadroia: Añade 5 tanques a la ciudad seleccionada
      - teknologia_aurreratua: Desbloquea una tecnología avanzada
      - maila_igo: Sube de nivel la ciudad seleccionada
      - baliabide_maximoak: Maximiza todos los recursos
      - mugimendu_infinitua: Habilita movimiento infinito para todas las unidades
      - zorion_maximoa: Maximiza la felicidad de la ciudad seleccionada
      - mapa_agertu: Revela todo el mapa (elimina la niebla de guerra)
      - help: Muestra esta ayuda
    `;
  }

  // Implementaciones de los trucos

  private buildAll(context: any): string {
    console.log('Solicitud para construir todos los edificios en la ciudad seleccionada');

    const currentGame = this.gameService.currentGame;

    // Comprobar si hay un juego activo
    if (!currentGame) {
      return 'Error: No hay ninguna partida activa.';
    }

    // Comprobar si hay ciudades del jugador actual
    const playerCities = currentGame.cities.filter(city => city.ownerId === currentGame.currentPlayerId);

    if (playerCities.length === 0) {
      return 'Error: No tienes ninguna ciudad. Debes fundar una ciudad primero.';
    }

    // Si solo hay una ciudad, usarla automáticamente
    if (playerCities.length === 1) {
      const city = playerCities[0];

      // Obtener el servicio de ciudad para construir los edificios
      const cityService = this.gameService.getCityService();

      // Simular la construcción de todos los edificios disponibles
      console.log(`Construyendo todos los edificios en ${city.name}`);

      // Aquí se construirían todos los edificios disponibles para la era actual
      // Por ahora solo actualizamos algunos valores de la ciudad
      city.buildings = city.buildings || [];

      // Lista de edificios básicos simulados como objetos CityBuilding
      const basicBuildings = [
        {
          id: 'granary',
          name: 'Granero',
          category: BuildingCategory.FOOD,
          level: 1,
          maxLevel: 3,
          era: Era.ANCIENT,
          cost: 60,
          upgradeCost: 120,
          maintenance: 1,
          effects: { food: 2 },
          description: 'Aumenta la producción de alimentos en la ciudad',
          icon: '🌾',
          constructionTurn: currentGame.turn,
          currentLevel: 1,
          isUpgrading: false
        },
        {
          id: 'library',
          name: 'Biblioteca',
          category: BuildingCategory.SCIENCE,
          level: 1,
          maxLevel: 3,
          era: Era.ANCIENT,
          cost: 80,
          upgradeCost: 160,
          maintenance: 1,
          effects: { science: 2 },
          description: 'Aumenta la producción de ciencia en la ciudad',
          icon: '📚',
          constructionTurn: currentGame.turn,
          currentLevel: 1,
          isUpgrading: false
        },
        {
          id: 'market',
          name: 'Mercado',
          category: BuildingCategory.GOLD,
          level: 1,
          maxLevel: 3,
          era: Era.ANCIENT,
          cost: 70,
          upgradeCost: 140,
          maintenance: 1,
          effects: { gold: 2 },
          description: 'Aumenta la producción de oro en la ciudad',
          icon: '💰',
          constructionTurn: currentGame.turn,
          currentLevel: 1,
          isUpgrading: false
        },
        {
          id: 'barracks',
          name: 'Cuartel',
          category: BuildingCategory.MILITARY,
          level: 1,
          maxLevel: 3,
          era: Era.ANCIENT,
          cost: 75,
          upgradeCost: 150,
          maintenance: 2,
          effects: { },
          description: 'Permite entrenar unidades militares más efectivas',
          icon: '⚔️',
          constructionTurn: currentGame.turn,
          currentLevel: 1,
          isUpgrading: false
        }
      ];

      // Añadir edificios que no existan ya
      let buildingsAdded = 0;
      basicBuildings.forEach(building => {
        if (!city.buildings.some(b => b.id === building.id)) {
          city.buildings.push(building);
          buildingsAdded++;
        }
      });

      // Actualizar la ciudad en el juego
      this.gameService.updateCity(city);

      if (buildingsAdded > 0) {
        return `Se han construido ${buildingsAdded} edificios en ${city.name}.`;
      } else {
        return `La ciudad ${city.name} ya tiene todos los edificios básicos disponibles.`;
      }
    }

    // Si hay más de una ciudad, mostrar un mensaje con las opciones
    let message = 'Tienes varias ciudades. Usa el comando "eraiki_guztiak:NOMBRE_CIUDAD" especificando el nombre de la ciudad donde quieres construir los edificios.\n\nCiudades disponibles:\n';

    playerCities.forEach(city => {
      message += `- ${city.name}\n`;
    });

    // Si el contexto incluye el nombre de una ciudad específica
    // También verificamos si se usó la sintaxis "eraiki_guztiak:CIUDAD"
    let cityName = context.specificCity || (context.params ? context.params.cityName : null);

    // Comprobar si el comando incluye una ciudad específica con el formato "eraiki_guztiak:CIUDAD"
    const cmdParts = context.command ? context.command.split(':') : [];
    if (cmdParts.length > 1) {
      cityName = cmdParts[1].trim();
    }

    if (cityName) {
      // Buscar la ciudad por nombre
      const targetCity = playerCities.find(city =>
        city.name.toLowerCase() === cityName.toLowerCase()
      );

      if (targetCity) {
        // Construir todos los edificios en la ciudad específica
        // Código similar al caso de ciudad única

        // Aquí se construirían todos los edificios disponibles para la era actual
        targetCity.buildings = targetCity.buildings || [];

        // Lista de edificios básicos simulados como objetos CityBuilding
        const basicBuildings = [
          {
            id: 'granary',
            name: 'Granero',
            category: BuildingCategory.FOOD,
            level: 1,
            maxLevel: 3,
            era: Era.ANCIENT,
            cost: 60,
            upgradeCost: 120,
            maintenance: 1,
            effects: { food: 2 },
            description: 'Aumenta la producción de alimentos en la ciudad',
            icon: '🌾',
            constructionTurn: currentGame.turn,
            currentLevel: 1,
            isUpgrading: false
          },
          {
            id: 'library',
            name: 'Biblioteca',
            category: BuildingCategory.SCIENCE,
            level: 1,
            maxLevel: 3,
            era: Era.ANCIENT,
            cost: 80,
            upgradeCost: 160,
            maintenance: 1,
            effects: { science: 2 },
            description: 'Aumenta la producción de ciencia en la ciudad',
            icon: '📚',
            constructionTurn: currentGame.turn,
            currentLevel: 1,
            isUpgrading: false
          },
          {
            id: 'market',
            name: 'Mercado',
            category: BuildingCategory.GOLD,
            level: 1,
            maxLevel: 3,
            era: Era.ANCIENT,
            cost: 70,
            upgradeCost: 140,
            maintenance: 1,
            effects: { gold: 2 },
            description: 'Aumenta la producción de oro en la ciudad',
            icon: '💰',
            constructionTurn: currentGame.turn,
            currentLevel: 1,
            isUpgrading: false
          },
          {
            id: 'barracks',
            name: 'Cuartel',
            category: BuildingCategory.MILITARY,
            level: 1,
            maxLevel: 3,
            era: Era.ANCIENT,
            cost: 75,
            upgradeCost: 150,
            maintenance: 2,
            effects: { },
            description: 'Permite entrenar unidades militares más efectivas',
            icon: '⚔️',
            constructionTurn: currentGame.turn,
            currentLevel: 1,
            isUpgrading: false
          }
        ];

        // Añadir edificios que no existan ya
        let buildingsAdded = 0;
        basicBuildings.forEach(building => {
          if (!targetCity.buildings.some(b => b.id === building.id)) {
            targetCity.buildings.push(building);
            buildingsAdded++;
          }
        });

        // Actualizar la ciudad en el juego
        this.gameService.updateCity(targetCity);

        if (buildingsAdded > 0) {
          return `Se han construido ${buildingsAdded} edificios en ${targetCity.name}.`;
        } else {
          return `La ciudad ${targetCity.name} ya tiene todos los edificios básicos disponibles.`;
        }
      } else {
        return `Error: No se encontró ninguna ciudad con el nombre "${cityName}".`;
      }
    }

    return message;
  }

  private instantDefeat(context: any): string {
    console.log('Solicitud de derrota inmediata');

    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      return 'Error: No hay ninguna partida activa.';
    }

    // Simular una derrota estableciendo la salud de todas las ciudades a cero
    // y eliminando todas las unidades del jugador
    currentGame.cities.forEach(city => {
      if (city.ownerId === currentGame.currentPlayerId) {
        city.health = 0;
        this.gameService.updateCity(city);
      }
    });

    // Eliminar todas las unidades del jugador
    currentGame.units = currentGame.units.filter(unit => unit.owner !== currentGame.currentPlayerId);

    // Mostrar una notificación de derrota
    try {
      // Obtener el servicio de notificación a través del injector para evitar dependencias circulares
      const notificationService = this.gameService['injector'].get(NotificationService);
      notificationService.error(
        'Derrota inmediata',
        'Has activado la trampa de derrota inmediata',
        {
          duration: 0 // Duración indefinida
        }
      );
    } catch (error) {
      console.error('Error al mostrar notificación de derrota:', error);
    }

    // Forzar actualización del juego
    this.gameService.updateGame();

    return 'Has perdido la partida. Pulsa "Salir" para volver al menú principal.';
  }

  private instantVictory(context: any): string {
    console.log('Solicitud de victoria inmediata');

    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      return 'Error: No hay ninguna partida activa.';
    }

    // Simular victoria conquistando todas las ciudades rivales
    currentGame.cities.forEach(city => {
      // Si la ciudad no es del jugador actual, convertirla
      if (city.ownerId !== currentGame.currentPlayerId) {
        city.ownerId = currentGame.currentPlayerId;
        city.name = `${city.name} (Conquistada)`;
        this.gameService.updateCity(city);
      }
    });

    // Eliminar todas las unidades enemigas
    currentGame.units = currentGame.units.filter(unit => unit.owner === currentGame.currentPlayerId || unit.owner === 'neutral');

    // Desbloquear todas las tecnologías disponibles
    if (currentGame.availableTechnologies) {
      currentGame.availableTechnologies.forEach(tech => {
        if (!currentGame.discoveredTechnologies.includes(tech)) {
          currentGame.discoveredTechnologies.push(tech);
        }
      });
    }

    // Avanzar a la era moderna
    currentGame.era = 'modern';

    // Mostrar notificación de victoria
    try {
      const notificationService = this.gameService['injector'].get(NotificationService);
      notificationService.success(
        'Victoria inmediata',
        'Has activado la trampa de victoria inmediata',
        {
          duration: 0, // Duración indefinida
          icon: '👑'
        }
      );
    } catch (error) {
      console.error('Error al mostrar notificación de victoria:', error);
    }

    // Forzar actualización del juego
    this.gameService.updateGame();

    return 'Has ganado la partida. Pulsa "Salir" para volver al menú principal.';
  }

  private addTankSquad(context: any): string {
    console.log('Solicitud para añadir 5 tanques a la ciudad seleccionada');

    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      return 'Error: No hay ninguna partida activa.';
    }

    // Comprobar si hay ciudades del jugador actual
    const playerCities = currentGame.cities.filter(city => city.ownerId === currentGame.currentPlayerId);

    if (playerCities.length === 0) {
      return 'Error: No tienes ninguna ciudad. Debes fundar una ciudad primero.';
    }

    // Si hay solo una ciudad, añadimos los tanques ahí
    if (playerCities.length === 1) {
      const city = playerCities[0];
      // Crear 5 tanques en la posición de la ciudad
      return this.createTanksNearCity(city, currentGame, 5);
    }

    // Si hay múltiples ciudades, buscar la ciudad seleccionada en el contexto
    let cityName = context.specificCity || (context.params ? context.params.cityName : null);

    // Comprobar si el comando incluye una ciudad específica con el formato "tanke_eskuadroia:CIUDAD"
    const cmdParts = context.command ? context.command.split(':') : [];
    if (cmdParts.length > 1) {
      cityName = cmdParts[1].trim();
    }

    if (cityName) {
      // Buscar la ciudad por nombre
      const targetCity = playerCities.find(city =>
        city.name.toLowerCase() === cityName.toLowerCase()
      );

      if (targetCity) {
        return this.createTanksNearCity(targetCity, currentGame, 5);
      } else {
        return `Error: No se encontró ninguna ciudad con el nombre "${cityName}".`;
      }
    }

    // Si hay varias ciudades y no se especificó ninguna, mostrar lista de opciones
    let message = 'Tienes varias ciudades. Usa el comando "tanke_eskuadroia:NOMBRE_CIUDAD" especificando el nombre de la ciudad donde quieres añadir los tanques.\n\nCiudades disponibles:\n';

    playerCities.forEach(city => {
      message += `- ${city.name}\n`;
    });

    return message;
  }

  // Método auxiliar para crear tanques cerca de una ciudad
  private createTanksNearCity(city: City, currentGame: GameSession, amount: number): string {
    // Posibles posiciones relativas alrededor de la ciudad
    const relativePositions = [
      {x: 0, y: 1}, {x: 1, y: 0}, {x: 0, y: -1}, {x: -1, y: 0}, // Cardinal
      {x: 1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}, {x: -1, y: 1} // Diagonal
    ];

    let tanksAdded = 0;
    const mapWidth = currentGame.map.width;
    const mapHeight = currentGame.map.height;

    for (let i = 0; i < amount; i++) {
      // Intentar encontrar una posición libre para el tanque
      for (let j = 0; j < relativePositions.length; j++) {
        const pos = {
          x: (city.position.x + relativePositions[j].x + mapWidth) % mapWidth,
          y: (city.position.y + relativePositions[j].y + mapHeight) % mapHeight
        };

        // Verificar si la posición está disponible (no hay otras unidades en esa casilla)
        const isOccupied = currentGame.units.some(unit =>
          unit.position.x === pos.x && unit.position.y === pos.y
        );

        // Verificar si la casilla es transitable
        let tileFound = null;

        // Comprobamos que las coordenadas estén dentro de los límites del mapa
        if (pos.y >= 0 && pos.y < mapHeight &&
            pos.x >= 0 && pos.x < mapWidth) {
          // Acceder correctamente al array bidimensional de tiles
          tileFound = currentGame.map.tiles[pos.y][pos.x];
        }

        // Si encontramos la casilla, verificamos si es transitable
        if (tileFound) {
          // Comprobar si el terreno es agua o si hay una montaña
          const terrainType = tileFound.terrain;
          const featureType = tileFound.featureType;

          const isWater = terrainType && (
            terrainType.includes('water') ||
            terrainType.includes('ocean')
          );
          const isMountain = featureType === 'mountain';

          const isPassable = !(isWater || isMountain);

          if (!isOccupied && isPassable) {
            // Crear un nuevo tanque
            const tank: UnitModel.Unit = {
                id: `tank_${Date.now() + i}`,
                name: 'Tank',
                type: 'tank',
                owner: currentGame.currentPlayerId,
                position: pos,
                movementPoints: 3,
                maxMovementPoints: 3,
                strength: 50,
                health: 150,
                maxHealth: 150,
                isRanged: false,
                canMove: true,
                isFortified: false,
                maxattacksPerTurn: 1,
                attacksPerTurn: 1,
                level: 1,
                cost: 0,
                turnsToComplete: 0,
                availableActions: ['move', 'attack', 'retreat'],
                attackRange: 1,
                canSwim: false
            };

            // Añadir el tanque al juego
            currentGame.units.push(tank);
            tanksAdded++;

            // Salir del bucle interno una vez colocado el tanque
            break;
          }
        }
      }
    }

    // Incrementar el nivel del tanque en el tracker si existe
    const tankLevelTracker = currentGame.unitLevelTracker.find(ut => ut.unitType === 'tank');
    if (tankLevelTracker && typeof tankLevelTracker.unitLevel === 'number' && tankLevelTracker.unitLevel < 5) {
      // Aumentar el nivel del tipo de unidad tank
      tankLevelTracker.unitLevel = tankLevelTracker.unitLevel + 1;
    }

    // Actualizar el estado del juego
    this.gameService.updateGame();

    // Mostrar notificación de éxito
    try {
      const notificationService = this.gameService['injector'].get(NotificationService);
      notificationService.success(
        'Tanques desplegados',
        `Se han añadido ${tanksAdded} tanques cerca de ${city.name}`,
        { duration: 5000, icon: '🛡️' }
      );
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
    }

    return `Se han añadido ${tanksAdded} tanques cerca de ${city.name}.`;
  }

  private giveAdvancedTech(context: any): string {
    console.log('Solicitud para otorgar tecnología avanzada');

    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      return 'Error: No hay ninguna partida activa.';
    }

    // Obtener las tecnologías disponibles que aún no han sido descubiertas
    const undiscoveredTechs = currentGame.availableTechnologies.filter(
      tech => !currentGame.discoveredTechnologies.includes(tech)
    );

    if (undiscoveredTechs.length === 0) {
      return 'Ya has descubierto todas las tecnologías disponibles.';
    }

    try {
      // Obtener el servicio de tecnología
      const technologyService = this.gameService['injector'].get(TechnologyService);

      // Obtener las tecnologías disponibles
      const allTechnologies = technologyService.getAvailableTechnologies(currentGame.discoveredTechnologies);
      const advancedEras = ['modern', 'age_of_discovery', 'medieval'];

      let selectedTech: string | undefined;

      // Intentar encontrar una tecnología de la era más avanzada posible
      for (const era of advancedEras) {
        const techsOfEra = undiscoveredTechs.filter(techId => {
          const techDetails = allTechnologies.find((t: any) => t.id === techId);
          return techDetails && techDetails.era === era;
        });

        if (techsOfEra.length > 0) {
          // Seleccionar una tecnología al azar de esta era
          const randomIndex = Math.floor(Math.random() * techsOfEra.length);
          selectedTech = techsOfEra[randomIndex];
          break;
        }
      }

      // Si no encontramos una tecnología en las eras avanzadas, seleccionar cualquier tecnología disponible
      if (!selectedTech && undiscoveredTechs.length > 0) {
        const randomIndex = Math.floor(Math.random() * undiscoveredTechs.length);
        selectedTech = undiscoveredTechs[randomIndex];
      }

      if (selectedTech) {
        // Añadir la tecnología a las descubiertas
        currentGame.discoveredTechnologies.push(selectedTech);

        // Obtener los detalles de la tecnología desbloqueada
        const techDetails = allTechnologies.find((t: any) => t.id === selectedTech);

        // Actualizamos la era del jugador si es necesario
        if (techDetails) {
          this.updatePlayerEra(currentGame);
        }

        // Notificación
        try {
          const notificationService = this.gameService['injector'].get(NotificationService);
          notificationService.success(
            'Tecnología avanzada desbloqueada',
            `Has desbloqueado la tecnología: ${techDetails?.name || selectedTech}`,
            {
              duration: 5000,
              icon: '🧪'
            }
          );
        } catch (error) {
          console.error('Error al mostrar notificación:', error);
        }

        // Actualizar el estado del juego
        this.gameService.updateGame();

        return `Has desbloqueado la tecnología avanzada: ${techDetails?.name || selectedTech}.`;
      }

      return 'No se pudo encontrar una tecnología avanzada para desbloquear.';
    } catch (error) {
      console.error('Error al otorgar tecnología avanzada:', error);
      return 'Error al intentar desbloquear tecnología avanzada.';
    }
  }

  // Actualiza la era del jugador según las tecnologías descubiertas
  private updatePlayerEra(currentGame: GameSession): void {
    // Cantidad de tecnologías por era
    const techCountByEra: Record<string, number> = {
      'modern': 0,
      'age_of_discovery': 0,
      'medieval': 0,
      'ancient': 0
    };

    try {
      // Obtener el servicio de tecnología
      const technologyService = this.gameService['injector'].get(TechnologyService);
      const allTechnologies = technologyService.getAvailableTechnologies(currentGame.discoveredTechnologies);

      // Contar tecnologías descubiertas por era
      currentGame.discoveredTechnologies.forEach(techId => {
        const tech = allTechnologies.find((t: any) => t.id === techId);
        if (tech) {
          techCountByEra[tech.era] = (techCountByEra[tech.era] || 0) + 1;
        }
      });

      // Determinar la era actual basada en las tecnologías descubiertas
      // Criterio simple: si tienes al menos una tecnología de una era, estás en esa era
      if (techCountByEra['modern'] > 0) {
        currentGame.era = 'modern';
      } else if (techCountByEra['age_of_discovery'] > 0) {
        currentGame.era = 'age_of_discovery';
      } else if (techCountByEra['medieval'] > 0) {
        currentGame.era = 'medieval';
      }
    } catch (error) {
      console.error('Error al actualizar la era del jugador:', error);
    }
  }

  private levelUpCity(context: any): string {
    console.log('Solicitud para subir de nivel la ciudad seleccionada');

    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      return 'Error: No hay ninguna partida activa.';
    }

    // Comprobar si hay ciudades del jugador actual
    const playerCities = currentGame.cities.filter(city => city.ownerId === currentGame.currentPlayerId);

    if (playerCities.length === 0) {
      return 'Error: No tienes ninguna ciudad. Debes fundar una ciudad primero.';
    }

    // Si solo hay una ciudad, subir su nivel automáticamente
    if (playerCities.length === 1) {
      const city = playerCities[0];
      return this.upgradeCityLevel(city, currentGame);
    }

    // Si hay múltiples ciudades, buscar la ciudad seleccionada en el contexto
    let cityName = context.specificCity || (context.params ? context.params.cityName : null);

    // Comprobar si el comando incluye una ciudad específica con el formato "maila_igo:CIUDAD"
    const cmdParts = context.command ? context.command.split(':') : [];
    if (cmdParts.length > 1) {
      cityName = cmdParts[1].trim();
    }

    if (cityName) {
      // Buscar la ciudad por nombre
      const targetCity = playerCities.find(city =>
        city.name.toLowerCase() === cityName.toLowerCase()
      );

      if (targetCity) {
        return this.upgradeCityLevel(targetCity, currentGame);
      } else {
        return `Error: No se encontró ninguna ciudad con el nombre "${cityName}".`;
      }
    }

    // Si hay varias ciudades y no se especificó ninguna, mostrar lista de opciones
    let message = 'Tienes varias ciudades. Usa el comando "maila_igo:NOMBRE_CIUDAD" especificando el nombre de la ciudad que quieres mejorar.\n\nCiudades disponibles:\n';

    playerCities.forEach(city => {
      message += `- ${city.name}\n`;
    });

    return message;
  }

  // Método auxiliar para mejorar el nivel de una ciudad
  private upgradeCityLevel(city: City, currentGame: GameSession): string {
    // Niveles de ciudad posibles
    const cityLevels = ['asentamiento', 'aldea', 'pueblo', 'ciudad', 'metrópoli'];

    // Encontrar el nivel actual y avanzar al siguiente
    const currentLevelIndex = cityLevels.indexOf(city.level);
    let newLevelIndex = Math.min(currentLevelIndex + 1, cityLevels.length - 1);

    // Si ya está en el nivel máximo
    if (currentLevelIndex === cityLevels.length - 1) {
      return `La ciudad ${city.name} ya está en su nivel máximo (${city.level}).`;
    }

    // Actualizar el nivel de la ciudad
    const oldLevel = city.level;
    city.level = cityLevels[newLevelIndex];

    // Aumentar población y capacidades según el nivel
    const populationBoost = 5;
    city.population = Math.min(city.population + populationBoost, city.maxPopulation);

    // Aumentar producción y otros recursos
    const resourceBoost = newLevelIndex + 1;
    city.foodPerTurn += resourceBoost;
    city.productionPerTurn += resourceBoost;
    city.goldPerTurn += resourceBoost;
    city.sciencePerTurn += resourceBoost;
    city.culturePerTurn += resourceBoost;

    // Aumentar felicidad
    city.happiness = Math.min(city.happiness + 10, 100);

    // Actualizar la defensa y salud de la ciudad
    const defenseBoost = (newLevelIndex + 1) * 5;
    city.defense += defenseBoost;
    city.maxHealth += defenseBoost * 2;
    city.health = city.maxHealth; // Restaurar salud al máximo

    // Guardar los cambios
    this.gameService.updateCity(city);

    // Notificar al jugador
    try {
      const notificationService = this.gameService['injector'].get(NotificationService);
      notificationService.success(
        'Ciudad mejorada',
        `La ciudad ${city.name} ha subido de nivel: ${oldLevel} → ${city.level}`,
        {
          duration: 5000,
          icon: '🏙️'
        }
      );
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
    }

    return `La ciudad ${city.name} ha subido de nivel: ${oldLevel} → ${city.level}. Se han mejorado todos sus atributos.`;
  }

  private maximizeResources(context: any): string {
    console.log('Solicitud para maximizar todos los recursos');

    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      return 'Error: No hay ninguna partida activa.';
    }

    // Establecer valores altos para los recursos del jugador
    const resourceBoost = 10000;

    // Aumentar oro
    currentGame.gold += resourceBoost;
    currentGame.goldPerTurn += 100;

    // Aumentar ciencia
    currentGame.science += resourceBoost;
    currentGame.sciencePerTurn += 100;

    // Aumentar cultura
    currentGame.culture += resourceBoost;
    currentGame.culturePerTurn += 100;

    // Aumentar felicidad global
    currentGame.happiness += 100;

    // Mejorar recursos para todas las ciudades del jugador
    const playerCities = currentGame.cities.filter(city => city.ownerId === currentGame.currentPlayerId);

    playerCities.forEach(city => {
      city.food += resourceBoost;
      city.production += resourceBoost;
      city.gold += resourceBoost;
      city.science += resourceBoost;
      city.culture += resourceBoost;

      city.foodPerTurn += 50;
      city.productionPerTurn += 50;
      city.goldPerTurn += 50;
      city.sciencePerTurn += 50;
      city.culturePerTurn += 50;

      city.happiness = 100; // Máxima felicidad

      // Actualizar la ciudad en el juego
      this.gameService.updateCity(city);
    });

    // Notificar al jugador
    try {
      const notificationService = this.gameService['injector'].get(NotificationService);
      notificationService.success(
        'Recursos maximizados',
        'Has maximizado todos tus recursos y producción',
        {
          duration: 5000,
          icon: '💰'
        }
      );
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
    }

    // Actualizar el estado del juego
    this.gameService.updateGame();

    return `Se han maximizado todos los recursos. +${resourceBoost} oro, ciencia y cultura. +100 en todas las tasas de producción.`;
  }

  private enableInfiniteMovement(context: any): string {
    console.log('Solicitud para habilitar movimiento infinito');

    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      return 'Error: No hay ninguna partida activa.';
    }

    // Contar cuántas unidades del jugador hay
    const playerUnits = currentGame.units.filter(unit => unit.owner === currentGame.currentPlayerId);

    if (playerUnits.length === 0) {
      return 'No tienes unidades a las que aplicar movimiento infinito.';
    }

    let unitsUpdated = 0;

    // Establecer puntos de movimiento altos para todas las unidades del jugador
    playerUnits.forEach(unit => {
      const infiniteMovement = 100;
      unit.movementPoints = infiniteMovement;
      unit.maxMovementPoints = infiniteMovement;
      unit.canMove = true;

      // Restaurar ataques por turno
      if (unit.maxattacksPerTurn > 0) {
        unit.attacksPerTurn = unit.maxattacksPerTurn * 5; // Permitir múltiples ataques
      }

      unitsUpdated++;
    });

    // Notificar al jugador
    try {
      const notificationService = this.gameService['injector'].get(NotificationService);
      notificationService.success(
        'Movimiento infinito activado',
        `Tus ${unitsUpdated} unidades pueden moverse libremente en este turno`,
        {
          duration: 5000,
          icon: '🚀'
        }
      );
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
    }

    // Actualizar el estado del juego
    this.gameService.updateGame();

    return `Movimiento infinito habilitado para todas tus unidades (${unitsUpdated}) en este turno.`;
  }

  private maximizeHappiness(context: any): string {
    console.log('Solicitud para maximizar la felicidad de la ciudad seleccionada');

    const currentGame = this.gameService.currentGame;
    if (!currentGame) {
      return 'Error: No hay ninguna partida activa.';
    }

    // Comprobar si hay ciudades del jugador actual
    const playerCities = currentGame.cities.filter(city => city.ownerId === currentGame.currentPlayerId);

    if (playerCities.length === 0) {
      return 'Error: No tienes ninguna ciudad. Debes fundar una ciudad primero.';
    }

    // Si solo hay una ciudad, aumentar su felicidad automáticamente
    if (playerCities.length === 1) {
      const city = playerCities[0];
      return this.boostCityHappiness(city, currentGame);
    }

    // Si hay múltiples ciudades, buscar la ciudad seleccionada en el contexto
    let cityName = context.specificCity || (context.params ? context.params.cityName : null);

    // Comprobar si el comando incluye una ciudad específica con el formato "zorion_maximoa:CIUDAD"
    const cmdParts = context.command ? context.command.split(':') : [];
    if (cmdParts.length > 1) {
      cityName = cmdParts[1].trim();
    }

    if (cityName) {
      // Buscar la ciudad por nombre
      const targetCity = playerCities.find(city =>
        city.name.toLowerCase() === cityName.toLowerCase()
      );

      if (targetCity) {
        return this.boostCityHappiness(targetCity, currentGame);
      } else {
        return `Error: No se encontró ninguna ciudad con el nombre "${cityName}".`;
      }
    }

    // Si hay varias ciudades y no se especificó ninguna, mostrar lista de opciones
    let message = 'Tienes varias ciudades. Usa el comando "zorion_maximoa:NOMBRE_CIUDAD" especificando el nombre de la ciudad cuya felicidad quieres maximizar.\n\nCiudades disponibles:\n';

    playerCities.forEach(city => {
      message += `- ${city.name}\n`;
    });

    return message;
  }

  // Método auxiliar para maximizar la felicidad de una ciudad
  private boostCityHappiness(city: City, currentGame: GameSession): string {
    // Guardar el valor anterior para mostrar el cambio
    const oldHappiness = city.happiness;

    // Establecer la felicidad al máximo
    city.happiness = 100;

    // Mejorar los recursos relacionados con la felicidad
    city.food += 100;
    city.gold += 100;
    city.foodPerTurn += 10;
    city.goldPerTurn += 10;

    // Ajustar distribución de población
    if (city.citizens) {
      // Aumentar especialistas que contribuyen a la felicidad
      if (city.citizens.merchants) {
        city.citizens.merchants += 2;
      }

      // Asegurar que los ciudadanos estén distribuidos adecuadamente
      if (city.citizens.unemployed && city.citizens.unemployed > 0) {
        const unemployed = city.citizens.unemployed;
        city.citizens.farmers = (city.citizens.farmers || 0) + Math.floor(unemployed / 3);
        city.citizens.merchants = (city.citizens.merchants || 0) + Math.floor(unemployed / 3);
        city.citizens.artists = (city.citizens.artists || 0) + Math.floor(unemployed / 3);
        city.citizens.unemployed = 0;
      }
    }

    // Si la ciudad tiene especialistas, aumentarlos
    if (city.specialists) {
      city.specialists.merchants = (city.specialists.merchants || 0) + 2;
      city.specialists.artists = (city.specialists.artists || 0) + 2;
    }

    // Actualizar la ciudad en el juego
    this.gameService.updateCity(city);

    // Notificar al jugador
    try {
      const notificationService = this.gameService['injector'].get(NotificationService);
      notificationService.success(
        'Ciudad feliz',
        `La ciudad ${city.name} ahora está extremadamente feliz`,
        {
          duration: 5000,
          icon: '😄'
        }
      );
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
    }

    // Actualizar el estado del juego
    this.gameService.updateGame();

    return `La felicidad de ${city.name} ha sido maximizada (${oldHappiness} → 100). Los ciudadanos celebran tu gobierno.`;
  }

  private revealMap(context: any): string {
    console.log('Solicitud para revelar todo el mapa');

    const currentGame = this.gameService.currentGame;
    if (currentGame && currentGame.map) {
      try {
        // Implementación real para revelar todo el mapa
        this.fogOfWarService.revealAllMap(currentGame.map, currentGame.currentPlayerId);
        console.log('Mapa completamente revelado');
        return 'El mapa completo ha sido revelado.';
      } catch (error) {
        console.error('Error al revelar el mapa:', error);
        return 'Error al revelar el mapa.';
      }
    }

    return 'No se pudo revelar el mapa. No hay partida activa.';
  }
}
