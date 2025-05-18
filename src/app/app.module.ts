import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    // ...otros componentes principales...
  ],
  imports: [
    BrowserModule,
    // HttpClientModule removed as it is deprecated,
    // ...otros módulos como AuthModule, GameModule, etc...
    // AppComponent is standalone and should not be imported here
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi())
  ]
  // Standalone components are bootstrapped using bootstrapApplication, not the bootstrap array
})
export class AppModule { }
