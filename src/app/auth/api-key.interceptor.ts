import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';

const STORAGE_KEY = 'ticketsApiKey';

// Pide la contraseña compartida una sola vez (se guarda en este navegador)
// y la manda como header X-Api-Key en cada request a la API. Protegido con
// isPlatformBrowser porque este interceptor también corre durante el
// renderizado en servidor (SSR/prerender), donde no existen window ni
// localStorage.
function getApiKey(): string {
  const key = window.localStorage.getItem(STORAGE_KEY);
  if (key) return key;
  const entered = window.prompt('Contraseña de acceso al Centro de Tickets:') || '';
  if (entered) window.localStorage.setItem(STORAGE_KEY, entered);
  return entered;
}

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const apiKey = getApiKey();
  const cloned = req.clone({ setHeaders: { 'X-Api-Key': apiKey } });

  return next(cloned).pipe(
    catchError((err) => {
      if (err?.status === 401) {
        // Contraseña incorrecta o faltante: la borramos para que la
        // siguiente petición la vuelva a pedir.
        window.localStorage.removeItem(STORAGE_KEY);
      }
      return throwError(() => err);
    })
  );
};
