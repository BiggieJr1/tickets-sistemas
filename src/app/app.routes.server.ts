import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // El listado de tickets es un dashboard dinámico que carga sus datos vía
  // HTTP en el cliente: no tiene sentido (ni es posible en build/CI sin la
  // API viva) prerenderizarlo estáticamente, así que se renderiza en cliente.
  {
    path: 'tickets',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
