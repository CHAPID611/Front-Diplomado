import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Limpiar localStorage antes de arrancar la aplicación
localStorage.removeItem('auth_token');
localStorage.removeItem('current_user');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
