import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { routes } from './app.routes';

@NgModule({
  declarations: [
    // ...otros componentes principales...
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    CoreModule, // Importamos el CoreModule que contiene los servicios de autenticación e interceptores
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi())
  ]
  // Standalone components are bootstrapped using bootstrapApplication, not the bootstrap array
})
export class AppModule { }
