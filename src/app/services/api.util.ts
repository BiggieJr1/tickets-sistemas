import { HttpErrorResponse } from '@angular/common/http';
import { isDevMode } from '@angular/core';

// En desarrollo (`ng serve`) se usa la ruta relativa `/api`, que
// proxy.conf.json redirige a http://localhost:5080 (la API corriendo local).
// En producción (build para Netlify) apunta directo a la API pública en Railway.
export const API_ROOT = isDevMode()
  ? '/api'
  : 'https://tickets-sistemas-backend-production.up.railway.app/api';

// Extrae un mensaje legible de un error HTTP: prioriza lo que mande el
// backend (string plano o { message }) antes que el texto genérico que
// arma Angular ("Http failure response for ...").
export function extraerMensajeError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'No se pudo conectar con la API.';
    if (typeof e.error === 'string' && e.error.trim()) return e.error;
    if (e.error?.message) return String(e.error.message);
    return `Error ${e.status}: ${e.statusText || 'algo salió mal'}.`;
  }
  return 'No se pudo conectar con la API.';
}
