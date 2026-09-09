import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// El Bearer token ya lo adjunta MsalInterceptor (ver app.config.ts) contra
// las rutas de protectedResourceMap; este interceptor solo reacciona a un
// 401 de la API (cuenta de Microsoft válida pero sin Colaborador activo)
// mandando de vuelta a /login.
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err?.status === 401) {
        auth.clearLocalSession();
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
