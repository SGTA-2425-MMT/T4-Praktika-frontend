import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../core/models/city.model';

interface BuildingOption {
  id: string;
  name: string;
  cost: number;
  turns: number;
  description: string;
  effects: string[];
  icon: string;
}

@Component({
  selector: 'app-city-buildings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './city-buildings.component.html',
  styleUrl: './city-buildings.component.scss'
})
export class CityBuildingsComponent {
  @Input() city: City | null = null;
  
  buildings: BuildingOption[] = [
    {
      id: 'granary',
      name: 'Granero',
      cost: 60,
      turns: 6,
      description: 'Aumenta la producción de alimentos en la ciudad',
      effects: ['+2 Alimentos por turno'],
      icon: '🌾'
    },
    {
      id: 'monument',
      name: 'Monumento',
      cost: 40,
      turns: 4,
      description: 'Un simple monumento para mejorar la cultura',
      effects: ['+1 Cultura por turno'],
      icon: '🗿'
    },
    {
      id: 'library',
      name: 'Biblioteca',
      cost: 80,
      turns: 8,
      description: 'Mejora la investigación científica',
      effects: ['+2 Ciencia por turno', '+1 Cultura por turno'],
      icon: '📚'
    },
    {
      id: 'market',
      name: 'Mercado',
      cost: 80,
      turns: 8,
      description: 'Aumenta la producción de oro',
      effects: ['+2 Oro por turno', '+10% bonificación comercial'],
      icon: '💰'
    }
  ];

  selectBuilding(buildingId: string): void {
    // Aquí implementaríamos la lógica para comenzar la construcción del edificio
    console.log(`Seleccionado edificio: ${buildingId}`);
  }
}
