import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiService, ScenarioOut } from '../api.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ScenarioService {
  private scenarios: ScenarioOut[] = [];

  constructor(
    private readonly apiService: ApiService,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Obtiene todos los escenarios disponibles
   * No requiere autenticación
   */
  async getAllScenarios(): Promise<ScenarioOut[]> {
    try {
      // Si ya tenemos escenarios cargados, los devolvemos
      if (this.scenarios.length > 0) {
        return this.scenarios;
      }

      // Si no, los obtenemos de la API
      const scenarios = await firstValueFrom(this.apiService.getScenarios());
      this.scenarios = scenarios;
      return scenarios;
    } catch (error) {
      console.error('Error al obtener escenarios:', error);
      this.notificationService.error('Error', 'No se pudieron cargar los escenarios disponibles');
      return [];
    }
  }

  /**
   * Obtiene un escenario por su ID
   * @param id ID del escenario
   */
  async getScenarioById(id: string): Promise<ScenarioOut | null> {
    // Intentar obtener de la caché local primero
    let scenario = this.scenarios.find(s => s._id === id);

    // Si no está en caché, intentar obtener todos los escenarios
    if (!scenario) {
      await this.getAllScenarios();
      scenario = this.scenarios.find(s => s._id === id);
    }

    return scenario || null;
  }

  /**
   * Obtiene el observable de escenarios directamente de la API
   * Útil para componentes que necesitan suscribirse
   */
  getScenarios(): Observable<ScenarioOut[]> {
    return this.apiService.getScenarios();
  }
}
