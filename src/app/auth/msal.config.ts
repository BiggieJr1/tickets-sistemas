import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { ENTRA_API_SCOPE, ENTRA_SPA_CLIENT_ID, ENTRA_TENANT_ID } from './entra.config';
import { API_ROOT } from '../services/api.util';

export function msalInstance(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: ENTRA_SPA_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}`,
      // Sin esto, MSAL manda como redirectUri la URL completa de la página
      // donde se dio clic (ej. ".../login"), y Azure la rechaza porque lo
      // que está registrado es el origen sin ruta
      // (https://generador-tickets.netlify.app, http://localhost:4200).
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      // localStorage (no sessionStorage) para que la sesión sobreviva un
      // refresh de la pestaña, igual que el token propio guardaba antes.
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message) => {
          if (level === LogLevel.Error) console.error(message);
        },
      },
    },
  });
}

export function msalGuardConfig(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: [ENTRA_API_SCOPE] },
  };
}

export function msalInterceptorConfig(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  // Cubre tanto la ruta relativa de dev (`/api/...`, vía proxy.conf.json)
  // como la URL completa de Railway en producción.
  protectedResourceMap.set(`${API_ROOT}/*`, [ENTRA_API_SCOPE]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}
