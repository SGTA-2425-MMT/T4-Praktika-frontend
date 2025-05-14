import { Component, Input, Output, EventEmitter, OnChanges, OnInit, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City, Building } from '../../../core/models/city.model';
import { CityService } from '../../../core/services/city.service';
import { TechnologyService } from '../../../core/services/technology.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-city-buildings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './city-buildings.component.html',
  styleUrl: './city-buildings.component.scss'
})
export class CityBuildingsComponent implements OnChanges, OnInit, OnDestroy {
  @Input() city: City | null = null;
  @Output() buildingSelected = new EventEmitter<string>();
  
  availableBuildings: Building[] = [];
  constructedBuildings: any[] = [];
  private subscriptions: Subscription[] = [];

  // Mantener registro de los edificios recién desbloqueados para resaltarlos
  newlyUnlockedBuildings: string[] = [];
  
  constructor(
    private cityService: CityService,
    private technologyService: TechnologyService
  ) {}
  
  ngOnInit(): void {
    // Suscribirse a cambios en las tecnologías descubiertas para actualizar edificios disponibles
    this.subscriptions.push(
      this.technologyService.discoveredTechnologies$.subscribe(techs => {
        if (techs && techs.length > 0 && this.city) {
          console.log(`[CityBuildingsComponent] Actualizando edificios disponibles. Tecnologías descubiertas: ${techs.length}`);
          
          // Si hay una nueva tecnología, buscar edificios desbloqueados por ella
          if (this.technologyService.lastCompletedTech) {
            const tech = this.technologyService.lastCompletedTech;
            console.log(`[CityBuildingsComponent] Última tecnología completada: ${tech.name}`);
            
            if (tech.unlocksBuildings && tech.unlocksBuildings.length > 0) {
              this.newlyUnlockedBuildings = [...tech.unlocksBuildings];
              console.log(`[CityBuildingsComponent] Nuevos edificios desbloqueados (${this.newlyUnlockedBuildings.length}):`, this.newlyUnlockedBuildings);
              
              // Forzar la actualización de la vista inmediatamente
              this.updateBuildingLists();
              
              // Programar la limpieza del resaltado después de 15 segundos (ampliado para dar más tiempo)
              setTimeout(() => {
                console.log('[CityBuildingsComponent] Limpiando resaltado de nuevos edificios');
                this.newlyUnlockedBuildings = [];
                // Forzar la actualización de la vista
                this.updateBuildingLists();
              }, 15000);
            }
          }
          
          this.updateBuildingLists();
        }
      })
    );
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['city'] && this.city) {
      this.updateBuildingLists();
    }
  }
  
  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  updateBuildingLists(): void {
    if (!this.city) return;
    
    // Obtener edificios disponibles para construir
    const allAvailableBuildings = this.cityService.getAvailableBuildings(this.city);
    
    // Eliminar duplicados basándose en IDs
    const buildingsMap = new Map<string, any>();
    allAvailableBuildings.forEach(building => {
      if (!buildingsMap.has(building.id)) {
        buildingsMap.set(building.id, building);
      }
    });
    
    this.availableBuildings = Array.from(buildingsMap.values());
    
    console.log(`[CityBuildingsComponent] Edificios disponibles para ${this.city.name} (${this.availableBuildings.length}):`, 
      this.availableBuildings.map(b => `${b.name} (ID: ${b.id})`).join(', '));
    
    // Formatear los edificios construidos para la vista
    const constructedBuildingsMap = new Map<string, any>();
    this.city.buildings
      .filter(building => building.currentLevel > 0)
      .forEach(building => {
        if (!constructedBuildingsMap.has(building.id)) {
          constructedBuildingsMap.set(building.id, building);
        }
      });
    
    this.constructedBuildings = Array.from(constructedBuildingsMap.values()).map(building => {
        const effectsArray = [];
        
        if (building.effects.food) {
          effectsArray.push(`+${building.effects.food * building.currentLevel} Alimentos por turno`);
        }
        if (building.effects.production) {
          effectsArray.push(`+${building.effects.production * building.currentLevel} Producción por turno`);
        }
        if (building.effects.gold) {
          effectsArray.push(`+${building.effects.gold * building.currentLevel} Oro por turno`);
        }
        if (building.effects.science) {
          effectsArray.push(`+${building.effects.science * building.currentLevel} Ciencia por turno`);
        }
        if (building.effects.culture) {
          effectsArray.push(`+${building.effects.culture * building.currentLevel} Cultura por turno`);
        }
        if (building.effects.defense) {
          effectsArray.push(`+${building.effects.defense * building.currentLevel} Defensa`);
        }
        if (building.effects.happiness) {
          effectsArray.push(`+${building.effects.happiness * building.currentLevel} Felicidad`);
        }
        
        return {
          ...building,
          canBeUpgraded: building.currentLevel < building.maxLevel,
          upgradeCost: building.upgradeCost,
          upgradeTurns: this.city?.productionPerTurn ? Math.ceil(building.upgradeCost / this.city.productionPerTurn) : 0,
          effects: effectsArray
        };
      });
  }

  // Método para seleccionar un edificio para construcción o mejora
  selectBuilding(buildingId: string): void {
    if (!this.city) return;
    
    // Verificar si es un edificio existente (para mejora) o nuevo (para construcción)
    const existingBuilding = this.city.buildings.find(b => b.id === buildingId);
    
    if (existingBuilding) {
      // El edificio ya existe, intentar mejorarlo
      const success = this.cityService.upgradeBuildingInQueue(this.city, buildingId);
      if (success) {
        console.log(`Mejora de edificio ${buildingId} añadida a la cola`);
      }
    } else {
      // Es un nuevo edificio, añadirlo a la cola de construcción
      const success = this.cityService.addBuildingToQueue(this.city, buildingId);
      if (success) {
        console.log(`Edificio ${buildingId} añadido a la cola de construcción`);
      }
    }
    
    // Actualizar las listas de edificios después de la acción
    this.updateBuildingLists();
    
    // Emitir evento para que el componente padre sepa que algo ha cambiado
    this.buildingSelected.emit(buildingId);
  }
  
  // Obtener el costo en turnos para construir un edificio
  getTurnsToBuild(building: Building): number {
    if (!this.city || !this.city.productionPerTurn) return 0;
    return Math.ceil(building.cost / this.city.productionPerTurn);
  }
  
  // Convertir efectos del edificio en strings para mostrar
  getBuildingEffectsAsStrings(building: Building): string[] {
    const effects = [];
    
    if (building.effects.food) {
      effects.push(`+${building.effects.food} Alimentos por turno`);
    }
    if (building.effects.production) {
      effects.push(`+${building.effects.production} Producción por turno`);
    }
    if (building.effects.gold) {
      effects.push(`+${building.effects.gold} Oro por turno`);
    }
    if (building.effects.science) {
      effects.push(`+${building.effects.science} Ciencia por turno`);
    }
    if (building.effects.culture) {
      effects.push(`+${building.effects.culture} Cultura por turno`);
    }
    if (building.effects.defense) {
      effects.push(`+${building.effects.defense} Defensa`);
    }
    if (building.effects.happiness) {
      effects.push(`+${building.effects.happiness} Felicidad`);
    }
    
    return effects;
  }

  // Obtener el nombre legible de la era
  getEraName(era: string): string {
    switch (era) {
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
        return era;
    }
  }
}
