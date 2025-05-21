import { Injectable } from '@angular/core';
import { GameService } from './game.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from './notification.service';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private debugModeEnabled = false;
  private readonly debugModeSubject = new BehaviorSubject<boolean>(this.debugModeEnabled);

  constructor(
    private readonly gameService: GameService,
    private readonly notificationService: NotificationService,
    private readonly apiService: ApiService
  ) {}

  /**
   * Activa o desactiva el modo de depuración
   */
  setDebugMode(enabled: boolean): void {
    this.debugModeEnabled = enabled;
    this.debugModeSubject.next(enabled);
    console.log(`Modo de depuración ${enabled ? 'activado' : 'desactivado'}`);

    if (enabled) {
      this.notificationService.info(
        'Modo de depuración activado',
        'Se han habilitado las herramientas de depuración para desarrolladores',
        { duration: 5000 }
      );
    }
  }

  /**
   * Comprueba si el modo de depuración está activado
   */
  isDebugModeEnabled(): boolean {
    return this.debugModeEnabled;
  }

  /**
   * Observable para suscribirse a cambios en el estado del modo de depuración
   */
  get debugModeEnabled$(): Observable<boolean> {
    return this.debugModeSubject.asObservable();
  }

  // Para depuración - imprimir estado actual de ciencia
  debugScienceStatus(): void {
    if (!this.debugModeEnabled) {
      this.notificationService.info('Debug', 'Activa el modo de depuración primero');
      return;
    }

    const game = this.gameService.currentGame;
    if (!game) {
      console.log('No hay juego activo');
      return;
    }

    console.log('=== ESTADO DE CIENCIA ===');
    console.log(`Ciencia total acumulada: ${game.science}`);
    console.log(`Ciencia por turno: ${game.sciencePerTurn}`);

    // Desglose por ciudades
    console.log('Desglose por ciudades:');
    game.cities.forEach(city => {
      if (city.ownerId === game.currentPlayerId) {
        console.log(`  ${city.name}: ${city.sciencePerTurn} (Científicos: ${city.citizens.scientists})`);
      }
    });

    // Investigación actual
    if (game.researchProgress) {
      console.log('Investigación actual:');
      console.log(`  Tecnología: ${game.researchProgress.currentTechnology}`);
      console.log(`  Progreso: ${game.researchProgress.progress}/${game.researchProgress.totalCost}`);
      console.log(`  Turnos estimados: ${game.researchProgress.turnsLeft}`);
    } else {
      console.log('No hay investigación en curso');
    }
    console.log('=======================');
  }

  // Corregir cualquier problema en la ciencia
  fixScienceIssues(): void {
    if (!this.debugModeEnabled) {
      this.notificationService.info('Debug', 'Activa el modo de depuración primero');
      return;
    }

    const game = this.gameService.currentGame;
    if (!game) {
      console.log('No hay juego activo');
      return;
    }

    console.log('=== CORRIGIENDO PROBLEMAS DE CIENCIA ===');
    console.log('1. Verificando cada ciudad...');

    // Recalcular la ciencia por turno sumando la de todas las ciudades
    let recalculatedScience = 0;
    game.cities.forEach(city => {
      if (city.ownerId === game.currentPlayerId) {
        // Guardar el valor anterior para depuración
        const oldScience = city.sciencePerTurn;

        // Asegurarse de que la ciencia por científico sea correcta
        const scientistScience = city.citizens.scientists * 2;
        const baseScience = 1; // Valor base + edificios

        // Sumar efectos de edificios
        let buildingScience = 0;
        city.buildings.forEach(building => {
          if (building.effects.science) buildingScience += building.effects.science;
        });

        city.sciencePerTurn = baseScience + scientistScience + buildingScience;

        // Acumular para el total
        recalculatedScience += city.sciencePerTurn;

        console.log(`Ciudad ${city.name}: ${oldScience} → ${city.sciencePerTurn} ciencia/turno (${city.citizens.scientists} científicos)`);
      }
    });

    // Actualizar la ciencia por turno en el juego
    if (game.sciencePerTurn !== recalculatedScience) {
      console.log(`2. Corrigiendo ciencia por turno: ${game.sciencePerTurn} => ${recalculatedScience}`);
      game.sciencePerTurn = recalculatedScience;
    } else {
      console.log('2. Los valores de ciencia por turno ya eran correctos');
    }

    console.log('3. Forzando actualización del estado del juego...');
    // Llamar al método del gameService para actualizar todo
    this.gameService.calculatePlayerResources();

    console.log('4. Forzando actualización de investigación...');
    // Forzar la actualización de investigación sin añadir ciencia
    this.forceResearchUpdate();

    console.log('5. Recursos recalculados correctamente');

    // Mostrar el estado actualizado
    this.debugScienceStatus();
  }

  // Método para forzar la actualización de la investigación sin añadir ciencia
  forceResearchUpdate(): void {
    if (!this.debugModeEnabled) {
      this.notificationService.info('Debug', 'Activa el modo de depuración primero');
      return;
    }

    const game = this.gameService.currentGame;
    if (!game) return;

    console.log('=== FORZANDO ACTUALIZACIÓN DE INVESTIGACIÓN ===');

    // Recalcular la ciencia proveniente de cada ciudad
    let totalScience = 0;
    game.cities.forEach(city => {
      if (city.ownerId === game.currentPlayerId) {
        console.log(`Ciudad ${city.name}: ${city.sciencePerTurn} ciencia/turno (${city.citizens.scientists} científicos)`);
        totalScience += city.sciencePerTurn;
      }
    });

    // Verificar si hay discrepancia con el valor almacenado en el juego
    if (game.sciencePerTurn !== totalScience) {
      console.log(`¡Valor de ciencia incorrecto en el juego! ${game.sciencePerTurn} vs calculado ${totalScience}`);
      game.sciencePerTurn = totalScience;
    }

    // Actualizar los turnos restantes para la tecnología actual si hay alguna
    if (game.researchProgress) {
      const oldTurnsLeft = game.researchProgress.turnsLeft;
      game.researchProgress.turnsLeft = Math.ceil(
        (game.researchProgress.totalCost - game.researchProgress.progress) / Math.max(1, game.sciencePerTurn)
      );

      console.log(`Turnos para completar ${game.researchProgress.currentTechnology}: ${oldTurnsLeft} → ${game.researchProgress.turnsLeft}`);
    }

    // Notificar los cambios
    this.gameService.updateGame();
  }

  /**
   * Muestra el estado completo del juego en una notificación y en la consola
   */
  showGameStateOverview(): void {
    if (!this.debugModeEnabled) {
      this.notificationService.info('Debug', 'Activa el modo de depuración primero');
      return;
    }

    const game = this.gameService.currentGame;
    if (!game) {
      this.notificationService.error('Error', 'No hay un juego activo');
      return;
    }

    const overview = {
      turno: game.turn,
      jugadorActual: game.currentPlayerId,
      fase: game.currentPhase,
      ciudades: game.cities.length,
      unidades: game.units.length,
      tecnologíasDescubiertas: game.discoveredTechnologies.length,
      oro: game.gold,
      oroPorTurno: game.goldPerTurn,
      ciencia: game.science,
      cienciaPorTurno: game.sciencePerTurn,
      cultura: game.culture,
      culturaPorTurno: game.culturePerTurn,
      felicidad: game.happiness,
      era: game.era
    };

    console.log('=== RESUMEN DEL ESTADO DEL JUEGO ===');
    console.table(overview);

    // Mostrar detalles adicionales
    console.log('=== DETALLES ADICIONALES ===');
    console.log(`ID del juego: ${game.id}`);
    console.log(`Civilización del jugador: ${game.playerCivilization}`);
    console.log(`Dificultad: ${game.difficulty}`);

    this.notificationService.info('Estado del juego',
      `Turno: ${overview.turno}\nFase: ${overview.fase}\nCiudades: ${overview.ciudades}\nUnidades: ${overview.unidades}`,
      { duration: 10000 }
    );
  }

  /**
   * Exporta el estado completo del juego actual en formato JSON
   */
  exportGameState(): void {
    if (!this.debugModeEnabled) {
      this.notificationService.info('Debug', 'Activa el modo de depuración primero');
      return;
    }

    const game = this.gameService.currentGame;
    if (!game) {
      this.notificationService.error('Error', 'No hay un juego activo');
      return;
    }

    try {
      const gameData = JSON.stringify(game, null, 2);

      // En un entorno web, podríamos permitir la descarga del JSON
      const blob = new Blob([gameData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Crear un enlace temporal para la descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamesession_${game.id}_turn_${game.turn}.json`;
      document.body.appendChild(a);
      a.click();

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      this.notificationService.success('Exportación completa', 'Estado del juego exportado correctamente');
    } catch (error) {
      console.error('Error al exportar estado del juego:', error);
      this.notificationService.error('Error', 'No se pudo exportar el estado del juego');
    }
  }

  /**
   * Comprueba la consistencia del estado del juego y reporta posibles problemas
   */
  checkGameStateConsistency(): void {
    if (!this.debugModeEnabled) {
      this.notificationService.info('Debug', 'Activa el modo de depuración primero');
      return;
    }

    const game = this.gameService.currentGame;
    if (!game) {
      console.log('No hay juego activo que verificar');
      return;
    }

    console.log('=== VERIFICANDO CONSISTENCIA DEL ESTADO DEL JUEGO ===');
    const issues: string[] = [];

    // Verificar unidades
    game.units.forEach(unit => {
      if (!unit.id) issues.push(`Unidad sin ID: ${JSON.stringify(unit)}`);
      if (!unit.owner) issues.push(`Unidad sin propietario: ${unit.id}`);
      if (unit.health <= 0) issues.push(`Unidad con salud <= 0 pero aún activa: ${unit.id}`);

      // Verificar posición dentro del mapa
      if (unit.position.x < 0 || unit.position.x >= game.map.width ||
          unit.position.y < 0 || unit.position.y >= game.map.height) {
        issues.push(`Unidad ${unit.id} fuera de los límites del mapa: (${unit.position.x}, ${unit.position.y})`);
      }
    });

    // Verificar ciudades
    game.cities.forEach(city => {
      if (!city.id) issues.push(`Ciudad sin ID: ${JSON.stringify(city)}`);
      if (!city.ownerId) issues.push(`Ciudad sin propietario: ${city.id}`);
      if (city.health <= 0) issues.push(`Ciudad con salud <= 0 pero aún activa: ${city.id}`);

      // Verificar posición dentro del mapa
      if (city.position.x < 0 || city.position.x >= game.map.width ||
          city.position.y < 0 || city.position.y >= game.map.height) {
        issues.push(`Ciudad ${city.id} fuera de los límites del mapa: (${city.position.x}, ${city.position.y})`);
      }
    });

    // Verificar dimensiones del mapa
    if (!game.map) {
      issues.push('Mapa no definido');
    } else {
      if (!game.map.tiles || game.map.tiles.length === 0) {
        issues.push('Mapa sin casillas');
      } else {
        if (game.map.tiles.length !== game.map.height) {
          issues.push(`Altura del mapa inconsistente: tiles.length(${game.map.tiles.length}) != height(${game.map.height})`);
        }

        if (game.map.tiles[0]?.length !== game.map.width) {
          issues.push(`Anchura del mapa inconsistente: tiles[0].length(${game.map.tiles[0]?.length}) != width(${game.map.width})`);
        }
      }
    }

    // Verificar coherencia de recursos
    let calculatedGoldPerTurn = 0;
    let calculatedSciencePerTurn = 0;

    game.cities.forEach(city => {
      if (city.ownerId === game.currentPlayerId) {
        calculatedGoldPerTurn += city.goldPerTurn || 0;
        calculatedSciencePerTurn += city.sciencePerTurn || 0;
      }
    });

    if (game.goldPerTurn !== calculatedGoldPerTurn) {
      issues.push(`Oro por turno inconsistente: game.goldPerTurn(${game.goldPerTurn}) != calculado(${calculatedGoldPerTurn})`);
    }

    if (game.sciencePerTurn !== calculatedSciencePerTurn) {
      issues.push(`Ciencia por turno inconsistente: game.sciencePerTurn(${game.sciencePerTurn}) != calculado(${calculatedSciencePerTurn})`);
    }

    // Reportar resultados
    if (issues.length > 0) {
      console.log(`Se encontraron ${issues.length} problemas:`);
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });

      this.notificationService.warning('Problemas de consistencia',
        `Se encontraron ${issues.length} problemas en el estado del juego. Ver consola para detalles.`);
    } else {
      console.log('No se encontraron problemas de consistencia. El estado del juego es válido.');
      this.notificationService.success('Consistencia verificada', 'No se encontraron problemas en el estado del juego');
    }

    console.log('=================================================');
  }

  /**
   * Verifica la comunicación con los endpoints de la API
   */
  async checkApiEndpoints(): Promise<void> {
    if (!this.debugModeEnabled) {
      this.notificationService.info('Debug', 'Activa el modo de depuración primero');
      return;
    }

    console.log('=== VERIFICANDO ENDPOINTS DE LA API ===');
    const results: { endpoint: string; status: 'OK' | 'ERROR'; time?: number; error?: string }[] = [];

    // Función auxiliar para probar un endpoint
    const testEndpoint = async (name: string, promiseFn: () => Promise<any>): Promise<void> => {
      const startTime = Date.now();
      try {
        console.log(`Probando endpoint: ${name}...`);
        await promiseFn();
        const elapsed = Date.now() - startTime;
        results.push({ endpoint: name, status: 'OK', time: elapsed });
        console.log(`✓ ${name}: OK (${elapsed}ms)`);
      } catch (error: any) {
        const elapsed = Date.now() - startTime;
        results.push({
          endpoint: name,
          status: 'ERROR',
          time: elapsed,
          error: error.message || 'Error desconocido'
        });
        console.log(`✗ ${name}: ERROR - ${error.message || 'Error desconocido'} (${elapsed}ms)`);
      }
    };

    // Probar endpoints
    await testEndpoint('GET /api/scenarios', async () => {
      await this.apiService.getScenarios().toPromise();
    });

    if (this.gameService.currentGame) {
      const gameId = this.gameService.currentGame.id;

      // Solo probar estos endpoints si hay un juego activo
      await testEndpoint('GET /api/games', async () => {
        await this.apiService.getGames().toPromise();
      });

      await testEndpoint(`GET /api/games/${gameId}`, async () => {
        await this.apiService.getGame(gameId).toPromise();
      });
    }

    // Mostrar resumen
    console.log('=== RESUMEN DE VERIFICACIÓN DE API ===');
    console.table(results);

    // Mostrar notificación
    const okCount = results.filter(r => r.status === 'OK').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;

    if (errorCount > 0) {
      this.notificationService.warning('Estado de la API',
        `${okCount} endpoints OK, ${errorCount} con errores. Ver consola para detalles.`);
    } else {
      this.notificationService.success('Estado de la API',
        `${okCount} endpoints verificados correctamente`);
    }
  }
}
