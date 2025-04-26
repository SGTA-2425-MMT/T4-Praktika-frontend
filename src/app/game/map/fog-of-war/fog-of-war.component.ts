import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fog-of-war',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fog-container" 
         [style.width.px]="width" 
         [style.height.px]="height"
         [class.explored]="isExplored && !isVisible">
    </div>
  `,
  styles: `
    .fog-container {
      position: absolute;
      top: 0;
      left: 0;
      background-color: black;
      opacity: 1;
      z-index: 40;
    }
    
    .fog-container.explored {
      background-color: rgba(0, 0, 0, 0.5);
      opacity: 0.7;
    }
  `
})
export class FogOfWarComponent {
  @Input() width: number = 0;
  @Input() height: number = 0;
  @Input() isExplored: boolean = false;
  @Input() isVisible: boolean = false;
}
