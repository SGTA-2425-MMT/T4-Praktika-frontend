import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Technology, TechEra, TechCategory, ResearchProgress } from '../../../core/models/technology.model';
import { TechnologyService } from '../../../core/services/technology.service';
import { GameService } from '../../../core/services/game.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tech-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tech-tree.component.html',
  styleUrl: './tech-tree.component.scss'
})
export class TechTreeComponent implements OnInit, OnDestroy {
  // Tecnologías
  technologies: Technology[] = [];
  availableTechnologies: Technology[] = [];
  discoveredTechnologies: Technology[] = [];
  currentResearch: ResearchProgress | null = null;
  
  // Organización visual
  techsByEra: { [key: string]: Technology[] } = {};
  
  // Ciencia por turno
  sciencePerTurn: number = 0;
  
  // Suscripciones
  private subscriptions: Subscription[] = [];

  // Exponer Math para usar en la plantilla
  Math = Math;

  constructor(
    private techService: TechnologyService,
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    // Obtener todas las tecnologías
    this.technologies = this.techService.getTechnologyTree();
    
    // Organizar tecnologías por era para la visualización
    this.organizeTechsByEra();
    
    // Suscribirse a cambios en las tecnologías disponibles
    this.subscriptions.push(
      this.techService.availableTechnologies$.subscribe(techs => {
        this.availableTechnologies = techs;
      })
    );
    
    // Suscribirse a cambios en las tecnologías descubiertas
    this.subscriptions.push(
      this.techService.discoveredTechnologies$.subscribe(techs => {
        this.discoveredTechnologies = techs;
      })
    );
    
    // Suscribirse a cambios en la investigación actual
    this.subscriptions.push(
      this.techService.researchProgress$.subscribe(research => {
        this.currentResearch = research;
      })
    );
    
    // Obtener la ciencia por turno del jugador
    this.updateSciencePerTurn();
  }
  
  ngOnDestroy(): void {
    // Cancelar todas las suscripciones al destruir el componente
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  // Organizar tecnologías por era para la visualización
  private organizeTechsByEra(): void {
    this.techsByEra = {};
    
    // Inicializar arreglos para cada era
    Object.values(TechEra).forEach(era => {
      this.techsByEra[era] = [];
    });
    
    // Asignar cada tecnología a su era correspondiente
    this.technologies.forEach(tech => {
      this.techsByEra[tech.era].push(tech);
    });
  }
  
  // Obtener la ciencia por turno del jugador actual
  private updateSciencePerTurn(): void {
    const game = this.gameService.currentGame;
    if (game) {
      // Calcular ciencia total de todas las ciudades del jugador
      let totalScience = 0;
      game.cities.forEach(city => {
        if (city.ownerId === game.currentPlayerId) {
          totalScience += city.sciencePerTurn;
        }
      });
      
      this.sciencePerTurn = totalScience;
    }
  }
  
  // Iniciar investigación de una tecnología
  startResearch(techId: string): void {
    if (this.currentResearch) {
      if (!confirm('Ya estás investigando otra tecnología. ¿Deseas cambiar?')) {
        return;
      }
    }
    
    const success = this.techService.startResearch(techId, this.sciencePerTurn);
    if (success) {
      console.log(`Comenzando a investigar: ${techId}`);
    } else {
      console.error('No se pudo iniciar la investigación');
    }
  }
  
  // Verificar si una tecnología está disponible para investigar
  isTechAvailable(techId: string): boolean {
    return this.availableTechnologies.some(t => t.id === techId);
  }
  
  // Verificar si una tecnología ya ha sido descubierta
  isTechDiscovered(techId: string): boolean {
    return this.discoveredTechnologies.some(t => t.id === techId);
  }
  
  // Verificar si una tecnología está siendo investigada actualmente
  isCurrentlyResearching(techId: string): boolean {
    return this.currentResearch?.technologyId === techId;
  }
  
  // Obtener el nombre de la era en español
  getEraName(era: string): string {
    switch (era) {
      case 'ancient':
        return 'Era Antigua';
      case 'classical':
        return 'Era Clásica';
      case 'medieval':
        return 'Era Medieval';
      case 'renaissance':
        return 'Era del Renacimiento';
      case 'industrial':
        return 'Era Industrial';
      case 'modern':
        return 'Era Moderna';
      default:
        return 'Desconocida';
    }
  }
  
  // Obtener el nombre de la categoría en español
  getCategoryName(category: TechCategory): string {
    const categoryNames: { [key: string]: string } = {
      [TechCategory.AGRICULTURE]: 'Agricultura',
      [TechCategory.WARFARE]: 'Guerra',
      [TechCategory.ECONOMY]: 'Economía',
      [TechCategory.SCIENCE]: 'Ciencia',
      [TechCategory.CULTURE]: 'Cultura',
      [TechCategory.EXPANSION]: 'Expansión'
    };
    return categoryNames[category] || category;
  }
  
  // Obtener color según la categoría
  getCategoryColor(category: TechCategory): string {
    const categoryColors: { [key: string]: string } = {
      [TechCategory.AGRICULTURE]: '#7cb342',
      [TechCategory.WARFARE]: '#e53935',
      [TechCategory.ECONOMY]: '#fdd835',
      [TechCategory.SCIENCE]: '#29b6f6',
      [TechCategory.CULTURE]: '#ab47bc',
      [TechCategory.EXPANSION]: '#8d6e63'
    };
    return categoryColors[category] || '#grey';
  }

  // Obtener nombre de una tecnología por su ID
  getTechName(techId: string): string {
    const tech = this.technologies.find(t => t.id === techId);
    return tech ? tech.name : techId;
  }
}
