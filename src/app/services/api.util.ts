import { HttpErrorResponse } from '@angular/common/http';

// Ruta relativa siempre: en desarrollo (`ng serve`) proxy.conf.json la
// redirige a http://localhost:5080; en el servidor propio, nginx sirve el
// build de Angular y hace proxy de /api/* al contenedor del backend en el
// mismo origen — no hace falta CORS ni una URL absoluta hardcodeada.
export const API_ROOT = '/api';

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
