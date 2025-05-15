import { Injectable } from '@angular/core';
import { Technology, TechEra, TechCategory, ResearchProgress } from '../models/technology.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TechnologyService {
  private availableTechnologies: Technology[] = [];
  private researchInProgress: ResearchProgress | null = null;
  
  // Propiedad para rastrear la última tecnología completada
  private _lastCompletedTech: Technology | null = null;

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
  
  // Getter para la última tecnología completada
  get lastCompletedTech(): Technology | null {
    return this._lastCompletedTech;
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
        cost: 0,
        description: 'El cultivo sistemático de plantas para obtener alimentos',
        effects: ['Permite construir Granjas', 'Las granjas producen +5 de alimento por turno'],
        unlocksBuildings: ['granary'],
        icon: '🌾'
      },
      {
        id: 'animal-husbandry',
        name: 'Ganadería',
        era: TechEra.ANCIENT,
        category: TechCategory.AGRICULTURE,
        cost: 0,
        description: 'La domesticación y cría de animales para obtener alimentos y recursos',
        effects: ['Las granjas ahora desbloquean la cria de animales', 'Las granjas producen +8 de alimento por turno'],
        prerequisites: ['agriculture'],
        icon: '🐄'
      },
      {
        id: 'horseback-riding',
        name: 'Equitación',
        era: TechEra.ANCIENT,
        category: TechCategory.WARFARE,
        cost: 0,
        description: 'El arte de montar y usar caballos en combate',
        effects: ['Permite entrenar unidades de caballería'],
        unlocksUnits: ['horseman'],
        prerequisites: ['animal-husbandry'],
        icon: '🐎'
      },
      {
        id: 'writing',
        name: 'Escritura',
        era: TechEra.ANCIENT,
        category: TechCategory.SCIENCE,
        cost: 0,
        description: 'La representación del lenguaje mediante símbolos escritos',
        effects: ['Permite construir bibliotecas', '+2 Ciencia por turno'],
        unlocksBuildings: ['library'],
        icon: '📜'
      },
      {
        id: 'roads',
        name: 'Caminos',
        era: TechEra.MEDIEVAL,
        category: TechCategory.EXPANSION,
        cost: 0,
        description: 'Permite construir caminos para facilitar el movimiento',
        effects: ['+1 movimiento en caminos'],
        unlocksBuildings: ['road'],
        icon: '⛏️'
      },
      {
        id: 'archery',
        name: 'Arco y Flecha',
        era: TechEra.ANCIENT,
        category: TechCategory.WARFARE,
        cost: 0,
        description: 'El uso de arcos para disparar flechas',
        effects: ['Permite entrenar arqueros'],
        unlocksUnits: ['archer'],
        icon: '🏹'
      },
      // Era Medieval
      {
        id: 'iron-working',
        name: 'Trabajo en Hierro',
        era: TechEra.MEDIEVAL,
        category: TechCategory.WARFARE,
        cost: 0,
        description: 'Desbloquea el trabajo con hierrro y mejorar las unidades militares',
        effects: ['Mejora el nivel de los guerreros', 'Mejora el nivel de los arqueros', 'Mejora el nivel de la caballería'],
        icon: '⚔️'
      },
      {
        id: 'engineering',
        name: 'Ingeniería',
        era: TechEra.MEDIEVAL,
        category: TechCategory.WARFARE,
        cost: 0,
        description: 'El desarrollo de técnicas avanzadas para construir máquinas de asedio',
        effects: ['Permite entrenar catapultas'],
        unlocksUnits: ['catapult'],
        prerequisites: ['mathematics'],
        icon: '🏗️'
      },
      {
        id: 'currency',
        name: 'Moneda',
        era: TechEra.MEDIEVAL,
        category: TechCategory.ECONOMY,
        cost: 80,
        description: 'Un sistema estandarizado de intercambio económico',
        effects: ['Permite construir mercados (CIUDAD)', 'Las ciudades producen +10 de oro por turno'],
        unlocksBuildings: ['market'],
        prerequisites: ['writing'],
        icon: '💰'
      },
      {
        id: 'mathematics',
        name: 'Matemáticas',
        era: TechEra.MEDIEVAL,
        category: TechCategory.SCIENCE,
        cost: 0,
        description: 'El estudio de números, cantidades y formas',
        effects: ['Permite construir catapultas', '+1 Ciencia en bibliotecas'],
        unlocksUnits: ['catapult'],
        prerequisites: ['writing'],
        icon: '➗'
      },


      // Era Medieval
      {
        id: 'education',
        name: 'Educación',
        era: TechEra.MEDIEVAL,
        category: TechCategory.SCIENCE,
        cost: 0,
        description: 'La instrucción sistemática para el desarrollo del conocimiento',
        effects: ['Permite construir universidades', '+40% ciencia en ciudades con biblioteca'],
        unlocksBuildings: ['university'],
        prerequisites: ['writing', 'mathematics'],
        icon: '🎓'
      },
      // Era de la colonización y revolución francesa
      {
        id: 'sailing',
        name: 'Navegación',
        era: TechEra.AGE_OF_DISCOVERY,
        category: TechCategory.EXPANSION,
        cost: 0,
        description: 'El arte de dirigir embarcaciones usando el viento',
        effects: ['Permite la creacion de puertos', 'Permite unidades navales', 'Permite atravesar océanos costeros'],
        unlocksUnits: ['galley'],
        icon: '⛵'
      },
      {
        id: 'gunpowder-warfare',
        name: 'Guerra de Pólvora',
        era: TechEra.AGE_OF_DISCOVERY,
        category: TechCategory.WARFARE,
        cost: 0,
        description: 'El uso de la pólvora para revolucionar las tácticas y armas de guerra',
        effects: ['Permite entrenar fusileros ', 'Permite construir cañones'],
        unlocksUnits: ['musketeer', 'cannon'],
        prerequisites: ['engineering'],
        icon: '💣'
      },
      {
        id: 'banking',
        name: 'Banca',
        era: TechEra.AGE_OF_DISCOVERY,
        category: TechCategory.ECONOMY,
        cost: 0,
        description: 'El sistema de actividades financieras y préstamos',
        effects: ['Permite construir bancos', '+25% oro en ciudades'],
        unlocksBuildings: ['bank'],
        prerequisites: ['currency', 'education'],
        icon: '🏦'
      },
      {
        id: 'advanced-colonization',
        name: 'Colonización Avanzada',
        era: TechEra.AGE_OF_DISCOVERY,
        category: TechCategory.EXPANSION,
        cost: 0,
        description: 'Mejoras para los colonos, permitiéndoles establecer ciudades con bonificaciones iniciales.',
        effects: ['+1 movimiento para colonos', 'Ciudades fundadas comienzan con +10 de producción'],
        unlocksUnits: ['settler'],
        prerequisites: ['sailing'],
        icon: '🌍'
      },
      {
        id: 'machinery',
        name: 'Maquinaria',
        era: TechEra.MODERN,
        category: TechCategory.PRODUCTION,
        cost: 140,
        description: 'La aparicion de maquinaria blindada para la guerra',
        effects: ['Permite la construccion de tanques'],
        unlocksBuildings: ['workshop'],
        prerequisites: ['industrialization'],
        icon: '⚙️'
      },
      {
        id: 'steel',
        name: 'Acero',
        era: TechEra.MODERN,
        category: TechCategory.PRODUCTION,
        cost: 160,
        description: 'La aleación de hierro y carbono para crear acero',
        effects: ['Permite construir fábricas', 'Mejora unidad de fusileros'],
        unlocksBuildings: ['factory'],
        prerequisites: ['machinery'],
        icon: '🛠️'
      },
      // Construccion de industrias
      {
        id: 'industrialization',
        name: 'Industrialización',
        era: TechEra.MODERN,
        category: TechCategory.PRODUCTION,
        cost: 200,
        description: 'La transformación de la producción mediante maquinaria y fábricas',
        effects: ['Permite construir fábricas', '+20% producción de unidades militares'],
        unlocksBuildings: ['factory'],
        prerequisites: ['steel'],
        icon: '🏭'
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
      console.log('[TechnologyService] Investigación completada. Buscando tecnología...');
      
      // Encontrar la tecnología completada
      const completedTech = this.availableTechnologies.find(
        t => t.id === this.researchInProgress!.technologyId
      );

      if (!completedTech) {
        console.error('[TechnologyService] Error: No se encontró la tecnología que se estaba investigando');
        return null;
      }
      
      console.log('[TechnologyService] Tecnología encontrada:', completedTech);

      // Añadir a descubiertas
      const discoveredTechs = [...this.discoveredTechnologies, completedTech];
      this.discoveredTechnologiesSubject.next(discoveredTechs);
      console.log(`[TechnologyService] Tecnologías descubiertas actualizadas. Total: ${discoveredTechs.length}`);

      // Actualizar tecnologías disponibles
      this.updateAvailableTechnologies();

      // Notificar sobre edificios y unidades desbloqueados
      let unlockMessage = `Tecnología completada: ${completedTech.name}`;

      // Verificar y registrar desbloqueos
      console.log('[TechnologyService] Verificando desbloqueos de edificios:', completedTech.unlocksBuildings);
      console.log('[TechnologyService] Verificando desbloqueos de unidades:', completedTech.unlocksUnits);

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
      console.log('[TechnologyService] Investigación actual limpiada.');

      console.log(unlockMessage);
      
      // Guardar referencia a la última tecnología completada
      this._lastCompletedTech = completedTech;
      console.log('[TechnologyService] Última tecnología completada actualizada:', this._lastCompletedTech?.name);
      
      // Programar que se limpie después de un tiempo razonable
      setTimeout(() => {
        this._lastCompletedTech = null;
      }, 30000); // 30 segundos
      
      return completedTech;
    }

    // Actualizar observable con progreso
    this.researchProgressSubject.next({...this.researchInProgress});
    return null;
  }

  // Actualizar la lista de tecnologías disponibles basadas en las descubiertas
  private updateAvailableTechnologies(): void {
    const discoveredTechIds = this.discoveredTechnologies.map(tech => tech.id);
    
    // Determinar la era actual del jugador
    const currentEra = this.getGameEra();
    console.log(`[TechnologyService] Era actual: ${currentEra}`);
    
    // Una tecnología está disponible si:
    // 1. No ha sido descubierta aún
    // 2. Todos sus prerrequisitos han sido descubiertos
    // 3. Pertenece a la era actual o a eras anteriores
    const availableTechs = this.availableTechnologies.filter(tech => {
      // No debe estar ya descubierta
      if (discoveredTechIds.includes(tech.id)) {
        return false;
      }

      // Verificar que la tecnología no pertenezca a una era futura
      const eraOrder = [TechEra.ANCIENT, TechEra.MEDIEVAL, TechEra.AGE_OF_DISCOVERY, TechEra.MODERN];
      const currentEraIndex = eraOrder.indexOf(currentEra);
      const techEraIndex = eraOrder.indexOf(tech.era);
      
      if (techEraIndex > currentEraIndex) {
        console.log(`[TechnologyService] Tecnología ${tech.name} (${tech.era}) no disponible en era actual ${currentEra}`);
        return false;
      }

      // Si no tiene prerrequisitos, está disponible
      if (!tech.prerequisites || tech.prerequisites.length === 0) {
        return true;
      }

      // Si tiene prerrequisitos, verificar que todos estén descubiertos
      return tech.prerequisites.every(prereqId => discoveredTechIds.includes(prereqId));
    });

    console.log(`[TechnologyService] Tecnologías disponibles actualizadas: ${availableTechs.length}`);
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

  // Obtener las unidades desbloqueadas por una tecnología
  getUnitsUnlockedByTech(techId: string): string[] {
    const technology = this.getTechnologyById(techId);
    return technology?.unlocksUnits || [];
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
  
  // Sincronizar el estado de investigación con el GameService
  syncResearchWithGame(gameResearch: any): void {
    if (!gameResearch) {
      this.researchInProgress = null;
      this.researchProgressSubject.next(null);
      return;
    }
    
    const tech = this.getTechnologyById(gameResearch.currentTechnology);
    if (!tech) return;
    
    this.researchInProgress = {
      technologyId: gameResearch.currentTechnology,
      name: tech.name,
      progress: gameResearch.progress,
      totalCost: gameResearch.totalCost,
      turnsRemaining: gameResearch.turnsLeft
    };
    
    this.researchProgressSubject.next(this.researchInProgress);
  }

  // Actualizar la era del juego/civilización basada en las tecnologías descubiertas
  getGameEra(): TechEra {
    // Contar tecnologías descubiertas por era
    const techs = this.discoveredTechnologies;
    if (techs.length === 0) return TechEra.ANCIENT;

    const eraCount = {
      [TechEra.ANCIENT]: 0,
      [TechEra.MEDIEVAL]: 0,
      [TechEra.AGE_OF_DISCOVERY]: 0,
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

    if (eraCount[TechEra.MODERN] >= 2 && eraCount[TechEra.AGE_OF_DISCOVERY] >= 3) {
      return TechEra.MODERN;
    }
     else if (eraCount[TechEra.AGE_OF_DISCOVERY] >= 2 && eraCount[TechEra.MEDIEVAL] >= 3) {
      return TechEra.AGE_OF_DISCOVERY;
    } else if (eraCount[TechEra.MEDIEVAL] >= 3 && eraCount[TechEra.ANCIENT] >= 4) {
      return TechEra.MEDIEVAL;
    }
    else {
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
      TechEra.AGE_OF_DISCOVERY,
      TechEra.MEDIEVAL,
      TechEra.ANCIENT
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
