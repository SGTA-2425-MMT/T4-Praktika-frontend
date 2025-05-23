import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CoreModule } from './core/core.module';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(), // Añadir soporte para animaciones
    provideHttpClient(withInterceptorsFromDi()), // Configurar HTTP con interceptores
    importProvidersFrom(CoreModule) // Importar CoreModule con servicios de autenticación
  ]
};
