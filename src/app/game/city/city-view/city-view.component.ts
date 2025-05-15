import { unitLevel } from './../../../core/models/unit.model';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../core/models/city.model';
import { CityBuildingsComponent } from '../city-buildings/city-buildings.component';
import { CityService } from '../../../core/services/city.service';
import { GameService } from '../../../core/services/game.service';
import { TechnologyService } from '../../../core/services/technology.service';
import { Unit } from '../../../core/models/unit.model';

@Component({
  selector: 'app-city-view',
  standalone: true,
  imports: [CommonModule, CityBuildingsComponent],
  templateUrl: './city-view.component.html',
  styleUrl: './city-view.component.scss'
})
export class CityViewComponent implements OnInit {
  @Input() city: City | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() production = new EventEmitter<{type: string, name: string}>();
  @Output() buildBuilding = new EventEmitter<string>();

  activeTab: 'overview' | 'production' | 'buildings' | 'citizens' = 'overview';

  // Exponer Math como propiedad para usarlo en la plantilla
  Math = Math;

  // Unidades disponibles para producir
  availableUnits: {type: string, name: string, cost: number, unlocked: boolean, description: string, icon: string}[] = [];

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
    private gameService: GameService,
    private technologyService: TechnologyService
  ) {}

  ngOnInit(): void {
    this.initializeAvailableUnits();

    // Suscribirse a cambios en las tecnologías descubiertas
    this.technologyService.discoveredTechnologies$.subscribe(techs => {
      if (techs && techs.length > 0) {
        this.updateAvailableUnits(techs);
      }
    });
  }

  // Método para cambiar entre pestañas
  changeTab(tab: 'overview' | 'production' | 'buildings' | 'citizens'): void {
    this.activeTab = tab;
    if (tab === 'production') {
      this.initializeAvailableUnits();
    }
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

    // Verificar si la unidad está desbloqueada
    if (!this.isUnitUnlocked(type)) {
      console.warn(`Intentando producir ${type}, pero esta unidad no está desbloqueada todavía.`);
      return;
    }

    // Encontrar la unidad en la lista de unidades disponibles
    const unitInfo = this.availableUnits.find(u => u.type === type);
    if (!unitInfo) {
      console.error(`Unidad ${type} no encontrada en la lista de unidades disponibles`);
      return;
    }

    // Emitir evento para ser manejado por el componente padre
    this.production.emit({type, name: unitInfo.name});

    console.log(`Ciudad ${this.city.name} comenzó a producir: ${unitInfo.name}`);
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
      case 'medieval':
        return 'Medieval';
      case 'age_of_discovery':
        return 'Era de los Descubrimientos';
      case 'modern':
        return 'Moderna';
      default:
        return 'Desconocida';
    }
  }

  // Inicializar las unidades disponibles
  private initializeAvailableUnits(): void {
    this.availableUnits = [
      { type: 'settler', name: 'Colono', cost: 80, unlocked: true, description: 'Funda nuevas ciudades', icon: '🏕️' },
      { type: 'worker', name: 'Trabajador', cost: 60, unlocked: true, description: 'Mejora casillas del terreno', icon: '🔧' },
      { type: 'warrior', name: 'Guerrero', cost: 40, unlocked: true, description: 'Unidad militar básica para defensa', icon: '⚔️' },
      { type: 'archer', name: 'Arquero', cost: 50, unlocked: this.isUnitUnlocked('archer'), description: 'Ataque a distancia, buena para defensa', icon: '🏹' },
      { type: 'horseman', name: 'Jinete', cost: 70, unlocked: this.isUnitUnlocked('horseman'), description: 'Unidad rápida para explorar y atacar', icon: '🐎' },
      { type: 'artillery', name: 'Artilleria', cost: 110, unlocked: this.isUnitUnlocked('artillery'), description: 'Unidad de asedio avanzada', icon: '💣' },
      { type: 'rifleman', name: 'Fusilero', cost: 80, unlocked: this.isUnitUnlocked('rifleman'), description: 'Unidad de combate avanzada', icon: '🔫' },
      { type: 'galley', name: 'Galera', cost: 65, unlocked: this.isUnitUnlocked('galley'), description: 'Transporte naval para unidades', icon: '⛵' },
      { type: 'warship', name: 'Barco de Guerra', cost: 100, unlocked: this.isUnitUnlocked('galley'), description: 'Unidad naval de combate', icon: '🚢' },
      { type: 'tank', name: 'Tanque', cost: 150, unlocked: this.isUnitUnlocked('tank'), description: 'Unidad de combate moderna', icon: '🚀' },
    ];

    // Actualizar estado inicial de desbloqueo basado en tecnologías
    this.updateAvailableUnits(this.technologyService.discoveredTechnologies);
  }

  // Actualizar unidades disponibles basado en tecnologías descubiertas
  private updateAvailableUnits(techs: any[]): void {
    if (!techs || techs.length === 0) return;

    console.log('Actualizando unidades disponibles basado en tecnologías descubiertas');

    // Mapeo de tecnologías a unidades
    const unlockMap: { [key: string]: string[] } = {
      'archery': ['archer'],
      'horseback-riding': ['horseman'],
      'iron-working': ['swordsman'],
      'engineering': ['catapult'],
      'sailing': ['galley'],
      'gunpowder-warfare': ['warship']
    };

    // Lista de todas las unidades desbloqueadas
    let unlockedUnits: string[] = [];

    // Acumular todas las unidades desbloqueadas por tecnologías
    techs.forEach(tech => {
      if (tech.id in unlockMap) {
        unlockedUnits = [...unlockedUnits, ...unlockMap[tech.id]];
      }

      // También verificar unlocksUnits en la tecnología
      if (tech.unlocksUnits && tech.unlocksUnits.length > 0) {
        unlockedUnits = [...unlockedUnits, ...tech.unlocksUnits];
      }
    });

    // Actualizar estado de desbloqueo
    this.availableUnits.forEach(unit => {
      // Unidades básicas siempre desbloqueadas
      if (['warrior', 'scout', 'settler', 'worker'].includes(unit.type)) {
        unit.unlocked = true;
      } else {
        // Resto de unidades según tecnologías
        unit.unlocked = unlockedUnits.includes(unit.type);
      }
    });

    console.log('Unidades disponibles actualizadas:',
      this.availableUnits.filter(u => u.unlocked).map(u => u.name).join(', '));
  }

  // Verificar si una unidad está desbloqueada
  isUnitUnlocked(type: string): boolean {
    const game = this.gameService.currentGame;
    if (!game) return false;
    const tracker = game.unitLevelTracker.find(u => u.unitType === type);
    return !!tracker && Number(tracker.unitLevel) > 0;
  }
}
