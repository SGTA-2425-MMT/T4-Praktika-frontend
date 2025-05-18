import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

// Configuración actualizada para incluir las rutas
const updatedConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideRouter(routes)
  ]
};

bootstrapApplication(AppComponent, updatedConfig)
  .catch((err) => console.error(err));
