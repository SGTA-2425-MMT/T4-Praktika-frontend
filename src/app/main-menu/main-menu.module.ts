import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainMenuComponent } from './main-menu.component';

@NgModule({
  imports: [CommonModule, MainMenuComponent],
  exports: [MainMenuComponent]
})
export class MainMenuModule {}
