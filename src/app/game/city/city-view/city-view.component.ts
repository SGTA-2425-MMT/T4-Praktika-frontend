import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../core/models/city.model';
import { CityBuildingsComponent } from '../city-buildings/city-buildings.component';
import { CityService } from '../../../core/services/city.service';
import { GameService } from '../../../core/services/game.service';

@Component({
  selector: 'app-city-view',
  standalone: true,
  imports: [CommonModule, CityBuildingsComponent],
  templateUrl: './city-view.component.html',
  styleUrl: './city-view.component.scss'
})
export class CityViewComponent {
  @Input() city: City | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() production = new EventEmitter<{type: string, name: string}>();
  @Output() buildBuilding = new EventEmitter<string>();
  
  activeTab: 'overview' | 'production' | 'buildings' | 'citizens' = 'overview';
  
  // Exponer Math como propiedad para usarlo en la plantilla
  Math = Math;
  
  // Tipos de ciudadanos para la gestión
  citizenTypes = [
    { key: 'farmers' as keyof City['citizens'], name: 'Granjeros', icon: '🌾', effect: '+2 Alimentos por turno' },
    { key: 'workers' as keyof City['citizens'], name: 'Trabajadores', icon: '🔨', effect: '+2 Producción por turno' },
    { key: 'merchants' as keyof City['citizens'], name: 'Comerciantes', icon: '💰', effect: '+2 Oro por turno' },
    { key: 'scientists' as keyof City['citizens'], name: 'Científicos', icon: '📚', effect: '+2 Ciencia por turno' },
    { key: 'artists' as keyof City['citizens'], name: 'Artistas', icon: '🎭', effect: '+2 Cultura por turno' }
  ];

  constructor(
    private cityService: CityService,
    private gameService: GameService
  ) {}

  // Método para cambiar entre pestañas
  changeTab(tab: 'overview' | 'production' | 'buildings' | 'citizens'): void {
    this.activeTab = tab;
  }

  // Cerrar la vista de la ciudad
  closeView(): void {
    this.close.emit();
  }

  // Calcular turnos restantes para crecer
  getTurnsToGrow(): number {
    if (!this.city) return 0;
    
    const foodNeeded = this.city.foodToGrow - this.city.food;
    return Math.ceil(foodNeeded / this.city.foodPerTurn);
  }
  
  // Método para seleccionar un elemento para producir
  selectProduction(type: string): void {
    if (!this.city) return;
    
    let name = '';
    
    switch (type) {
      case 'warrior':
        name = 'Guerrero';
        break;
      case 'settler':
        name = 'Colono';
        break;
      case 'worker':
        name = 'Trabajador';
        break;
      case 'archer':
        name = 'Arquero';
        break;
      case 'horseman':
        name = 'Jinete';
        break;
      case 'swordsman':
        name = 'Espadachín';
        break;
      case 'catapult':
        name = 'Catapulta';
        break;
      case 'galley':
        name = 'Galera';
        break;
      case 'warship':
        name = 'Barco de Guerra';
        break;
      case 'scout':
        name = 'Explorador';
        break;
      default:
        name = 'Desconocido';
    }
    
    // Emitir evento para ser manejado por el componente padre
    this.production.emit({type, name});
    
    console.log(`Ciudad ${this.city.name} comenzó a producir: ${name}`);
  }

  // Método para asignar un ciudadano a un rol
  assignCitizen(role: string): void {
    if (!this.city) return;
    
    const success = this.cityService.assignCitizen(this.city, role as keyof City['citizens']);
    
    if (success) {
      console.log(`Ciudadano asignado como ${role}`);
      console.log(`Antes de actualizar: sciencePerTurn = ${this.gameService.currentGame?.sciencePerTurn}`);
      
      // Actualizar la ciudad en el servicio de juego primero
      this.gameService.updateCity(this.city);
      
      // Luego recalcular los recursos totales del jugador
      this.gameService.calculatePlayerResources();
      
      console.log(`Después de actualizar: sciencePerTurn = ${this.gameService.currentGame?.sciencePerTurn}`);
      console.log('Recursos del jugador actualizados después de asignar ciudadano');
    }
  }
  
  // Método para desasignar un ciudadano de un rol
  unassignCitizen(role: string): void {
    if (!this.city) return;
    
    const success = this.cityService.unassignCitizen(this.city, role as keyof City['citizens']);
    
    if (success) {
      console.log(`Ciudadano liberado de ${role}`);
      console.log(`Antes de actualizar: sciencePerTurn = ${this.gameService.currentGame?.sciencePerTurn}`);
      
      // Actualizar la ciudad en el servicio de juego primero
      this.gameService.updateCity(this.city);
      
      // Luego recalcular los recursos totales del jugador
      this.gameService.calculatePlayerResources();
      
      console.log(`Después de actualizar: sciencePerTurn = ${this.gameService.currentGame?.sciencePerTurn}`);
      console.log('Recursos del jugador actualizados después de desasignar ciudadano');
    }
  }
  
  // Gestionar la construcción de un edificio
  onBuildingSelected(buildingId: string): void {
    if (!this.city) return;
    
    // Emitir evento para que el componente padre gestione la construcción
    // sin afectar a la cola de producción de unidades
    this.buildBuilding.emit(buildingId);
    
    // Cambiar a la pestaña de edificios para mostrar el progreso
    this.activeTab = 'buildings';
  }
  
  // Obtener la era actual de la ciudad como texto
  getEraName(): string {
    if (!this.city) return 'Antigua';
    
    switch (this.city.era) {
      case 'ancient':
        return 'Antigua';
      case 'classical':
        return 'Clásica';
      case 'medieval':
        return 'Medieval';
      case 'renaissance':
        return 'Renacimiento';
      case 'industrial':
        return 'Industrial';
      case 'modern':
        return 'Moderna';
      default:
        return 'Desconocida';
    }
  }
}
