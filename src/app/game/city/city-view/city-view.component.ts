import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../core/models/city.model';
import { CityBuildingsComponent } from '../city-buildings/city-buildings.component';

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
  
  activeTab: 'overview' | 'production' | 'buildings' = 'overview';
  
  // Exponer Math como propiedad para usarlo en la plantilla
  Math = Math;

  constructor() {}

  // Método para cambiar entre pestañas
  changeTab(tab: 'overview' | 'production' | 'buildings'): void {
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
}
