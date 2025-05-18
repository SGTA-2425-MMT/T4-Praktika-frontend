import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Technology {
  id: string;
  name: string;
  description: string;
  cost: number;
  era: string;
  prerequisites: string[];
  enables: string[];
  iconPath?: string;
}

export interface PlayerState {
  id: string;
  name: string;
  civilization: string;
  resources: {
    gold: number;
    goldPerTurn: number;
    science: number;
    sciencePerTurn: number;
    culture: number;
    culturePerTurn: number;
    happiness: number;
  };
  research: {
    currentTechnology?: string;
    progress: number;
    turnsRemaining: number;
  };
  technologies: string[];
  availableTechnologies: string[];
  era: 'ancient' | 'classical' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'information';
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private readonly playerStateSubject = new BehaviorSubject<PlayerState | null>(null);

  // Definición de las tecnologías disponibles
  private readonly availableTechnologies: Technology[] = [
    {
      id: 'agriculture',
      name: 'Agricultura',
      description: 'El cultivo de plantas y la domesticación de animales.',
      cost: 20,
      era: 'ancient',
      prerequisites: [],
      enables: ['pottery', 'animal_husbandry'],
      iconPath: 'assets/icons/tech/agriculture.png'
    },
    {
      id: 'pottery',
      name: 'Alfarería',
      description: 'El arte de crear vasijas de barro.',
      cost: 35,
      era: 'ancient',
      prerequisites: ['agriculture'],
      enables: ['writing', 'calendar'],
      iconPath: 'assets/icons/tech/pottery.png'
    },
    {
      id: 'animal_husbandry',
      name: 'Ganadería',
      description: 'El cuidado y reproducción de animales domesticados.',
      cost: 35,
      era: 'ancient',
      prerequisites: ['agriculture'],
      enables: ['trapping', 'horseback_riding'],
      iconPath: 'assets/icons/tech/animal_husbandry.png'
    },
    {
      id: 'mining',
      name: 'Minería',
      description: 'La extracción de minerales del subsuelo.',
      cost: 35,
      era: 'ancient',
      prerequisites: [],
      enables: ['masonry', 'bronze_working'],
      iconPath: 'assets/icons/tech/mining.png'
    },
    {
      id: 'sailing',
      name: 'Navegación',
      description: 'El arte de controlar barcos mediante velas.',
      cost: 35,
      era: 'ancient',
      prerequisites: [],
      enables: ['astronomy', 'optics'],
      iconPath: 'assets/icons/tech/sailing.png'
    }
  ];

  constructor() {}

  get playerState$(): Observable<PlayerState | null> {
    return this.playerStateSubject.asObservable();
  }

  get playerState(): PlayerState | null {
    return this.playerStateSubject.value;
  }

  // Inicializar el estado del jugador
  initializePlayer(id: string, name: string, civilization: string): void {
    const initialState: PlayerState = {
      id,
      name,
      civilization,
      resources: {
        gold: 50,
        goldPerTurn: 2,
        science: 0,
        sciencePerTurn: 1,
        culture: 0,
        culturePerTurn: 1,
        happiness: 0
      },
      research: {
        progress: 0,
        turnsRemaining: 0
      },
      technologies: [],
      availableTechnologies: ['agriculture', 'mining', 'sailing'],
      era: 'ancient'
    };

    this.playerStateSubject.next(initialState);
  }

  // Iniciar investigación de una tecnología
  startResearch(technologyId: string): boolean {
    const playerState = this.playerState;
    if (!playerState) return false;

    // Verificar si la tecnología está disponible
    if (!playerState.availableTechnologies.includes(technologyId)) {
      return false;
    }

    // Encontrar la tecnología
    const technology = this.availableTechnologies.find(tech => tech.id === technologyId);
    if (!technology) return false;

    // Configurar la investigación
    const updatedState: PlayerState = {
      ...playerState,
      research: {
        currentTechnology: technologyId,
        progress: 0,
        turnsRemaining: Math.ceil(technology.cost / playerState.resources.sciencePerTurn)
      }
    };

    this.playerStateSubject.next(updatedState);
    return true;
  }

  // Procesar la investigación en un turno
  processResearch(): void {
    const playerState = this.playerState;
    if (!playerState?.research.currentTechnology) return;

    const technology = this.availableTechnologies.find(
      tech => tech.id === playerState.research.currentTechnology
    );

    if (!technology) return;

    // Añadir progreso
    const progress = playerState.research.progress + playerState.resources.sciencePerTurn;

    // Verificar si se ha completado
    if (progress >= technology.cost) {
      // Añadir a las tecnologías descubiertas
      const updatedTechnologies = [...playerState.technologies, technology.id];

      // Actualizar tecnologías disponibles
      const newAvailableTechnologies = this.calculateAvailableTechnologies(updatedTechnologies);

      // Actualizar estado del jugador
      this.playerStateSubject.next({
        ...playerState,
        technologies: updatedTechnologies,
        availableTechnologies: newAvailableTechnologies,
        research: {
          progress: 0,
          turnsRemaining: 0
        }
      });

      console.log(`Tecnología descubierta: ${technology.name}`);
    } else {
      // Actualizar progreso
      this.playerStateSubject.next({
        ...playerState,
        research: {
          currentTechnology: technology.id,
          progress: progress,
          turnsRemaining: Math.ceil((technology.cost - progress) / playerState.resources.sciencePerTurn)
        }
      });
    }
  }

  // Calcular qué tecnologías están disponibles basándose en las ya descubiertas
  private calculateAvailableTechnologies(discoveredTechs: string[]): string[] {
    return this.availableTechnologies
      .filter(tech => !discoveredTechs.includes(tech.id)) // No incluir las ya descubiertas
      .filter(tech => {
        // Incluir solo si todos sus prerequisitos están cumplidos
        if (tech.prerequisites.length === 0) return true;
        return tech.prerequisites.every(prereq => discoveredTechs.includes(prereq));
      })
      .map(tech => tech.id);
  }

  // Actualizar recursos tras un turno
  updateResources(goldPerTurn: number, sciencePerTurn: number, culturePerTurn: number): void {
    const playerState = this.playerState;
    if (!playerState) return;

    this.playerStateSubject.next({
      ...playerState,
      resources: {
        ...playerState.resources,
        gold: playerState.resources.gold + goldPerTurn,
        goldPerTurn,
        sciencePerTurn,
        culturePerTurn
      }
    });
  }

  // Obtener información de una tecnología
  getTechnologyInfo(techId: string): Technology | undefined {
    return this.availableTechnologies.find(tech => tech.id === techId);
  }
}
