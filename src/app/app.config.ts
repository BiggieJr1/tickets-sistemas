import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { MsalInterceptor, MsalModule, MsalService } from '@azure/msal-angular';
import { msalGuardConfig, msalInstance, msalInterceptorConfig } from './auth/msal.config';
import { unauthorizedInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([unauthorizedInterceptor])),
    importProvidersFrom(MsalModule.forRoot(msalInstance(), msalGuardConfig(), msalInterceptorConfig())),
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    // Antes de que el router resuelva la primera ruta: inicializa MSAL,
    // procesa el regreso de un login por redirect (si lo hay) y carga el
    // perfil local del colaborador (GET /api/auth/me) — si no, los guards
    // verían currentUser() en null todavía y mandarían al login a alguien
    // que ya tiene sesión activa con Microsoft.
    provideAppInitializer(() => {
      const msal = inject(MsalService);
      const auth = inject(AuthService);
      return firstValueFrom(
        msal.initialize().pipe(concatMap(() => msal.handleRedirectObservable())),
      ).then(() => auth.restoreSession());
    }),
  ],
};
