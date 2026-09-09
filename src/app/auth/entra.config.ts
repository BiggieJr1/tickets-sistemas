// Valores del App Registration en Microsoft Entra ID (tenant de Bisoft). No
// son secretos: viajan embebidos en el bundle del SPA, igual que la URL de
// la API en api.util.ts.
export const ENTRA_TENANT_ID = 'e3821ff1-5752-48ab-b6d8-718c531dc602';

// Client ID (Application ID) del App Registration "tickets-sistemas-frontend"
// (plataforma "Single-page application").
export const ENTRA_SPA_CLIENT_ID = 'c50e32a0-dd31-4e62-a160-2e9169da72d3';

// Scope expuesto por el App Registration "tickets-sistemas-api" en
// "Expose an API" (Application ID URI + nombre del scope).
export const ENTRA_API_SCOPE = 'api://ddf52754-eb15-48d5-9314-1d8951f6313f/access_as_user';
