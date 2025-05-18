import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    // ...otros componentes principales...
  ],
  imports: [
    BrowserModule
    // ...otros módulos como AuthModule, GameModule, etc...
    // AppComponent is standalone and should not be imported here
  ],
  providers: []
  // Standalone components are bootstrapped using bootstrapApplication, not the bootstrap array
})
export class AppModule { }
