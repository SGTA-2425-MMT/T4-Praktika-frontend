import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
    // ...otros componentes principales...
  ],
  imports: [
    BrowserModule
    // ...otros módulos como AuthModule, GameModule, etc...
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
