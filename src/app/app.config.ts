import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Espera a validar la sesión guardada antes de que el router resuelva
    // la primera ruta — si no, los guards verían currentUser() en null
    // todavía y mandarían al login a alguien que sigue con sesión activa.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ]
};
