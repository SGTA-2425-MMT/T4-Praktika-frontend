import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceType } from '../../../core/models/map.model';

@Component({
  selector: 'app-resource-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resource-icon" [title]="resourceName">
      <img [src]="'assets/images/resources/' + resourceType + '.png'" [alt]="resourceName">
    </div>
  `,
  styles: `
    .resource-icon {
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 20px;
      height: 20px;
      z-index: 30;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  `
})
export class ResourceIconComponent {
  @Input() resourceType!: ResourceType;

  get resourceName(): string {
    const names: Record<ResourceType, string> = {
      horses: 'Caballos',
      iron: 'Hierro',
      coal: 'Carbón',
      oil: 'Petróleo',
      aluminum: 'Aluminio',
      uranium: 'Uranio',
      wheat: 'Trigo',
      cattle: 'Ganado',
      sheep: 'Ovejas',
      bananas: 'Plátanos',
      deer: 'Ciervos',
      fish: 'Peces',
      gold: 'Oro',
      silver: 'Plata',
      gems: 'Gemas',
      marble: 'Mármol',
      ivory: 'Marfil',
      silk: 'Seda',
      spices: 'Especias'
    };

    return names[this.resourceType] || 'Recurso';
  }
}
