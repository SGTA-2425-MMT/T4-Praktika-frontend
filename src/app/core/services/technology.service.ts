import { Injectable } from '@angular/core';
import { Technology, TechEra, TechCategory, ResearchProgress } from '../models/technology.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TechnologyService {
  private availableTechnologies: Technology[] = [];
  private researchInProgress: ResearchProgress | null = null;
  
  private researchProgressSubject = new BehaviorSubject<ResearchProgress | null>(null);
  private discoveredTechnologiesSubject = new BehaviorSubject<Technology[]>([]);
  private availableTechnologiesSubject = new BehaviorSubject<Technology[]>([]);
  
  constructor() { 
    this.initializeTechnologies();
  }
  
  // Observables para suscribirse desde los componentes
  get researchProgress$(): Observable<ResearchProgress | null> {
    return this.researchProgressSubject.asObservable();
  }
  
  get discoveredTechnologies$(): Observable<Technology[]> {
    return this.discoveredTechnologiesSubject.asObservable();
  }
  
  get availableTechnologies$(): Observable<Technology[]> {
    return this.availableTechnologiesSubject.asObservable();
  }
  
  // Getters
  get currentResearch(): ResearchProgress | null {
    return this.researchInProgress;
  }
  
  get discoveredTechnologies(): Technology[] {
    return this.discoveredTechnologiesSubject.value;
  }
  
  get availableTechs(): Technology[] {
    return this.availableTechnologiesSubject.value;
  }
  
  // Inicializar las tecnologías del juego
  private initializeTechnologies(): void {
    this.availableTechnologies = [
      // Era Antigua
      {
        id: 'agriculture',
        name: 'Agricultura',
        era: TechEra.ANCIENT,
        category: TechCategory.AGRICULTURE,
        cost: 20,
        description: 'El cultivo sistemático de plantas para obtener alimentos',
        effects: ['Permite construir Granjeros', '+1 Alimento en casillas de llanuras'],
        unlocksBuildings: ['granary'],
        icon: '🌾'
      },
      {
        id: 'animal-husbandry',
        name: 'Ganadería',
        era: TechEra.ANCIENT,
        category: TechCategory.AGRICULTURE,
        cost: 30,
        description: 'La domesticación y cría de animales para obtener alimentos y recursos',
        effects: ['Revela recursos de caballos', '+1 Producción en casillas con ganado'],
        prerequisites: ['agriculture'],
        icon: '🐄'
      },
      {
        id: 'mining',
        name: 'Minería',
        era: TechEra.ANCIENT,
        category: TechCategory.EXPANSION,
        cost: 30,
        description: 'La extracción de minerales útiles de la tierra',
        effects: ['Permite construir minas', 'Revela recursos de hierro'],
        unlocksBuildings: ['mine'],
        icon: '⛏️'
      },
      {
        id: 'sailing',
        name: 'Navegación',
        era: TechEra.ANCIENT,
        category: TechCategory.EXPANSION,
        cost: 35,
        description: 'El arte de dirigir embarcaciones usando el viento',
        effects: ['Permite unidades navales', 'Permite atravesar océanos costeros'],
        unlocksUnits: ['galley'],
        icon: '⛵'
      },
      {
        id: 'pottery',
        name: 'Alfarería',
        era: TechEra.ANCIENT,
        category: TechCategory.CULTURE,
        cost: 25,
        description: 'El arte de crear vasijas de arcilla',
        effects: ['Permite construir graneros'],
        unlocksBuildings: ['pottery'],
        icon: '🏺'
      },
      {
        id: 'archery',
        name: 'Arco y Flecha',
        era: TechEra.ANCIENT,
        category: TechCategory.WARFARE,
        cost: 30,
        description: 'El uso de arcos para disparar flechas',
        effects: ['Permite entrenar arqueros'],
        unlocksUnits: ['archer'],
        icon: '🏹'
      },
      {
        id: 'bronze-working',
        name: 'Trabajo en Bronce',
        era: TechEra.ANCIENT,
        category: TechCategory.WARFARE,
        cost: 40,
        description: 'La aleación de cobre y estaño para crear bronce',
        effects: ['Permite construir cuarteles', 'Permite entrenar espadachines'],
        unlocksBuildings: ['barracks'],
        unlocksUnits: ['swordsman'],
        prerequisites: ['mining'],
        icon: '⚔️'
      },
      {
        id: 'writing',
        name: 'Escritura',
        era: TechEra.ANCIENT,
        category: TechCategory.SCIENCE,
        cost: 45,
        description: 'La representación del lenguaje mediante símbolos escritos',
        effects: ['Permite construir bibliotecas', '+2 Ciencia por turno'],
        unlocksBuildings: ['library'],
        icon: '📜'
      },
      
      // Era Clásica
      {
        id: 'currency',
        name: 'Moneda',
        era: TechEra.CLASSICAL,
        category: TechCategory.ECONOMY,
        cost: 80,
        description: 'Un sistema estandarizado de intercambio económico',
        effects: ['Permite construir mercados', '+25% de oro en rutas comerciales'],
        unlocksBuildings: ['market'],
        prerequisites: ['writing'],
        icon: '💰'
      },
      {
        id: 'mathematics',
        name: 'Matemáticas',
        era: TechEra.CLASSICAL,
        category: TechCategory.SCIENCE,
        cost: 90,
        description: 'El estudio de números, cantidades y formas',
        effects: ['Permite construir catapultas', '+1 Ciencia en bibliotecas'],
        unlocksUnits: ['catapult'],
        prerequisites: ['writing'],
        icon: '➗'
      },
      {
        id: 'iron-working',
        name: 'Trabajo en Hierro',
        era: TechEra.CLASSICAL,
        category: TechCategory.WARFARE,
        cost: 85,
        description: 'La forja del hierro para crear herramientas y armas',
        effects: ['Permite entrenar legiones', '+10% producción de unidades militares'],
        unlocksUnits: ['legion'],
        prerequisites: ['bronze-working'],
        icon: '⚒️'
      },
      
      // Era Medieval
      {
        id: 'education',
        name: 'Educación',
        era: TechEra.MEDIEVAL,
        category: TechCategory.SCIENCE,
        cost: 150,
        description: 'La instrucción sistemática para el desarrollo del conocimiento',
        effects: ['Permite construir universidades', '+40% ciencia en ciudades con biblioteca'],
        unlocksBuildings: ['university'],
        prerequisites: ['writing', 'mathematics'],
        icon: '🎓'
      },
      {
        id: 'machinery',
        name: 'Maquinaria',
        era: TechEra.MEDIEVAL,
        category: TechCategory.PRODUCTION,
        cost: 140,
        description: 'El uso de dispositivos mecánicos para facilitar el trabajo',
        effects: ['Permite construir talleres', '+1 Producción en minas'],
        unlocksBuildings: ['workshop'],
        prerequisites: ['mathematics'],
        icon: '⚙️'
      },
      
      // Era Renacimiento
      {
        id: 'banking',
        name: 'Banca',
        era: TechEra.RENAISSANCE,
        category: TechCategory.ECONOMY,
        cost: 200,
        description: 'El sistema de actividades financieras y préstamos',
        effects: ['Permite construir bancos', '+25% oro en ciudades'],
        unlocksBuildings: ['bank'],
        prerequisites: ['currency', 'education'],
        icon: '🏦'
      }
    ];
    
    // Inicialmente, solo las tecnologías de la Era Antigua sin prerrequisitos están disponibles
    const initialTechs = this.availableTechnologies.filter(tech => 
      tech.era === TechEra.ANCIENT && (!tech.prerequisites || tech.prerequisites.length === 0)
    );
    
    this.availableTechnologiesSubject.next(initialTechs);
  }
  
  // Comenzar a investigar una tecnología
  startResearch(technologyId: string, sciencePerTurn: number): boolean {
    const tech = this.availableTechnologies.find(t => t.id === technologyId);
    
    if (!tech) {
      console.error(`Tecnología ${technologyId} no encontrada`);
      return false;
    }
    
    // Verificar prerrequisitos
    if (tech.prerequisites && tech.prerequisites.length > 0) {
      const discoveredTechIds = this.discoveredTechnologies.map(t => t.id);
      if (!tech.prerequisites.every(prereq => discoveredTechIds.includes(prereq))) {
        console.error(`No se cumplen los prerrequisitos para investigar ${tech.name}`);
        return false;
      }
    }
    
    // Iniciar investigación
    this.researchInProgress = {
      technologyId: tech.id,
      name: tech.name,
      progress: 0,
      totalCost: tech.cost,
      turnsRemaining: Math.max(1, Math.ceil(tech.cost / Math.max(1, sciencePerTurn)))
    };
    
    this.researchProgressSubject.next(this.researchInProgress);
    console.log(`Comenzando a investigar: ${tech.name} (Ciencia por turno: ${sciencePerTurn}, Costo total: ${tech.cost}, Turnos estimados: ${this.researchInProgress.turnsRemaining})`);
    
    return true;
  }
  
  // Actualizar el progreso de la investigación actual
  updateResearchProgress(sciencePerTurn: number): Technology | null {
    if (!this.researchInProgress) {
      return null;
    }
    
    // Asegurarnos de que la ciencia por turno sea al menos 1 para evitar divisiones por cero
    const effectiveSciencePerTurn = Math.max(1, sciencePerTurn);
    
    // Actualizar progreso
    this.researchInProgress.progress += effectiveSciencePerTurn;
    console.log(`Progreso de investigación actualizado: ${this.researchInProgress.progress}/${this.researchInProgress.totalCost} (${effectiveSciencePerTurn} añadido)`);
    
    // Calcular turnos restantes (evitando división por cero)
    this.researchInProgress.turnsRemaining = Math.max(0, 
      Math.ceil((this.researchInProgress.totalCost - this.researchInProgress.progress) / effectiveSciencePerTurn)
    );
    
    // Comprobar si se completó la investigación
    if (this.researchInProgress.progress >= this.researchInProgress.totalCost) {
      // Encontrar la tecnología completada
      const completedTech = this.availableTechnologies.find(
        t => t.id === this.researchInProgress!.technologyId
      );
      
      if (!completedTech) {
        console.error('No se encontró la tecnología que se estaba investigando');
        return null;
      }
      
      // Añadir a descubiertas
      const discoveredTechs = [...this.discoveredTechnologies, completedTech];
      this.discoveredTechnologiesSubject.next(discoveredTechs);
      
      // Actualizar tecnologías disponibles
      this.updateAvailableTechnologies();
      
      // Notificar sobre edificios y unidades desbloqueados
      let unlockMessage = `Tecnología completada: ${completedTech.name}`;
      
      if (completedTech.unlocksBuildings && completedTech.unlocksBuildings.length > 0) {
        unlockMessage += `\nEdificios desbloqueados: ${completedTech.unlocksBuildings.join(', ')}`;
      }
      
      if (completedTech.unlocksUnits && completedTech.unlocksUnits.length > 0) {
        unlockMessage += `\nUnidades desbloqueadas: ${completedTech.unlocksUnits.join(', ')}`;
      }
      
      // Limpiar investigación actual
      const completedResearch = this.researchInProgress;
      this.researchInProgress = null;
      this.researchProgressSubject.next(null);
      
      console.log(unlockMessage);
      return completedTech;
    }
    
    // Actualizar observable con progreso
    this.researchProgressSubject.next({...this.researchInProgress});
    return null;
  }
  
  // Actualizar la lista de tecnologías disponibles basadas en las descubiertas
  private updateAvailableTechnologies(): void {
    const discoveredTechIds = this.discoveredTechnologies.map(tech => tech.id);
    
    // Una tecnología está disponible si:
    // 1. No ha sido descubierta aún
    // 2. Todos sus prerrequisitos han sido descubiertos
    const availableTechs = this.availableTechnologies.filter(tech => {
      // No debe estar ya descubierta
      if (discoveredTechIds.includes(tech.id)) {
        return false;
      }
      
      // Si no tiene prerrequisitos, está disponible
      if (!tech.prerequisites || tech.prerequisites.length === 0) {
        return true;
      }
      
      // Si tiene prerrequisitos, verificar que todos estén descubiertos
      return tech.prerequisites.every(prereqId => discoveredTechIds.includes(prereqId));
    });
    
    this.availableTechnologiesSubject.next(availableTechs);
  }
  
  // Verificar si una tecnología está descubierta
  isTechnologyDiscovered(technologyId: string): boolean {
    return this.discoveredTechnologies.some(tech => tech.id === technologyId);
  }
  
  // Obtener tecnología por id
  getTechnology(technologyId: string): Technology | undefined {
    return this.availableTechnologies.find(tech => tech.id === technologyId);
  }
  
  // Obtener una tecnología por su ID
  getTechnologyById(techId: string): Technology | undefined {
    return this.getTechnologyTree().find(tech => tech.id === techId);
  }

  // Obtener los edificios desbloqueados por una tecnología
  getBuildingsUnlockedByTech(techId: string): string[] {
    const technology = this.getTechnologyById(techId);
    return technology?.unlocksBuildings || [];
  }
  
  // Obtener todas las tecnologías disponibles para investigar
  getAvailableTechnologies(discoveredTechIds: string[]): Technology[] {
    // Obtener todas las tecnologías
    const allTechs = this.getTechnologyTree();
    
    // Una tecnología está disponible si:
    // 1. No ha sido descubierta aún
    // 2. Todos sus prerrequisitos han sido descubiertos
    return allTechs.filter(tech => {
      // No debe estar ya descubierta
      if (discoveredTechIds.includes(tech.id)) {
        return false;
      }
      
      // Si no tiene prerrequisitos, está disponible
      if (!tech.prerequisites || tech.prerequisites.length === 0) {
        return true;
      }
      
      // Si tiene prerrequisitos, verificar que todos estén descubiertos
      return tech.prerequisites.every(prereqId => discoveredTechIds.includes(prereqId));
    });
  }
  
  // Devuelve el árbol completo de tecnologías
  getTechnologyTree(): Technology[] {
    return [...this.availableTechnologies];
  }
  
  // Actualizar la era del juego/civilización basada en las tecnologías descubiertas
  getGameEra(): TechEra {
    // Contar tecnologías descubiertas por era
    const techs = this.discoveredTechnologies;
    if (techs.length === 0) return TechEra.ANCIENT;
    
    const eraCount = {
      [TechEra.ANCIENT]: 0,
      [TechEra.CLASSICAL]: 0,
      [TechEra.MEDIEVAL]: 0,
      [TechEra.RENAISSANCE]: 0,
      [TechEra.INDUSTRIAL]: 0,
      [TechEra.MODERN]: 0
    };
    
    techs.forEach(tech => {
      eraCount[tech.era]++;
    });
    
    // Criterios para avanzar a una era:
    // - Renaissance: Al menos 2 tecnologías de Renaissance y 3 de Medieval
    // - Industrial: Al menos 2 tecnologías de Industrial y 3 de Renaissance
    // - Modern: Al menos 2 tecnologías de Modern y 3 de Industrial
    // - Medieval: Al menos 3 tecnologías de Medieval y 4 de Classical
    // - Classical: Al menos 5 tecnologías de Ancient y 2 de Classical
    // - Por defecto: Ancient
    
    if (eraCount[TechEra.MODERN] >= 2 && eraCount[TechEra.INDUSTRIAL] >= 3) {
      return TechEra.MODERN;
    } else if (eraCount[TechEra.INDUSTRIAL] >= 2 && eraCount[TechEra.RENAISSANCE] >= 3) {
      return TechEra.INDUSTRIAL;
    } else if (eraCount[TechEra.RENAISSANCE] >= 2 && eraCount[TechEra.MEDIEVAL] >= 3) {
      return TechEra.RENAISSANCE;
    } else if (eraCount[TechEra.MEDIEVAL] >= 3 && eraCount[TechEra.CLASSICAL] >= 4) {
      return TechEra.MEDIEVAL;
    } else if (eraCount[TechEra.ANCIENT] >= 5 && eraCount[TechEra.CLASSICAL] >= 2) {
      return TechEra.CLASSICAL;
    } else {
      return TechEra.ANCIENT;
    }
  }

  // Determinar la era basada en las tecnologías descubiertas
  determineEra(discoveredTechs: (Technology | undefined)[]): TechEra {
    // Eliminar posibles valores undefined
    const validTechs = discoveredTechs.filter(tech => tech !== undefined) as Technology[];
    
    // Si no hay tecnologías descubiertas, es la era antigua
    if (validTechs.length === 0) return TechEra.ANCIENT;
    
    // Verificar era por era, de más avanzada a más antigua
    const erasToCheck = [
      TechEra.MODERN,
      TechEra.INDUSTRIAL,
      TechEra.RENAISSANCE,
      TechEra.MEDIEVAL,
      TechEra.CLASSICAL
    ];
    
    for (const era of erasToCheck) {
      // Para pasar a una era, necesitamos al menos 2 tecnologías de esa era
      const techsInEra = validTechs.filter(tech => tech.era === era);
      if (techsInEra.length >= 2) {
        return era;
      }
    }
    
    // Por defecto, era antigua
    return TechEra.ANCIENT;
  }
}
