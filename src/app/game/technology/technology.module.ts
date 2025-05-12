import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TechTreeComponent } from './tech-tree/tech-tree.component';

@NgModule({
  imports: [
    CommonModule,
    TechTreeComponent
  ],
  exports: [
    TechTreeComponent
  ]
})
export class TechnologyModule { }
