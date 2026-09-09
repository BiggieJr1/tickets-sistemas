import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { firstValueFrom } from 'rxjs';
import { Colaborador } from '../models/colaborador.model';
import { ENTRA_API_SCOPE } from '../auth/entra.config';
import { API_ROOT, extraerMensajeError } from './api.util';

const API_BASE = `${API_ROOT}/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private msal = inject(MsalService);

  // Perfil local del colaborador (Id, EsAdministrador, Activo) — Microsoft
  // solo confirma quién es la persona, no si tiene cuenta en esta app.
  readonly currentUser = signal<Colaborador | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isAdmin = computed(() => this.currentUser()?.esAdministrador ?? false);

  async login(): Promise<void> {
    this.error.set(null);
    // Redirect: la página navega a Microsoft y vuelve; el resto del login
    // (procesar el regreso, cargar el perfil) lo hace el appInitializer en
    // app.config.ts cuando la app arranca de nuevo.
    await firstValueFrom(this.msal.loginRedirect({ scopes: [ENTRA_API_SCOPE] }));
  }

  // Cierra sesión también en Microsoft (botón "Salir" del header).
  async logout(): Promise<void> {
    this.currentUser.set(null);
    await firstValueFrom(this.msal.logoutRedirect());
  }

  // Solo limpia el perfil local, sin tocar la sesión de Microsoft — se usa
  // cuando la API rechaza con 401 (cuenta sin Colaborador activo): la cuenta
  // de Microsoft sigue siendo válida, es esta app la que no la reconoce.
  clearLocalSession(): void {
    this.currentUser.set(null);
  }

  // Se llama una sola vez al arrancar la app (provideAppInitializer en
  // app.config.ts), después de que MSAL ya procesó un posible regreso de
  // login por redirect.
  async restoreSession(): Promise<void> {
    const cuentas = this.msal.instance.getAllAccounts();
    if (cuentas.length === 0) return;

    if (!this.msal.instance.getActiveAccount()) {
      this.msal.instance.setActiveAccount(cuentas[0]);
    }

    this.loading.set(true);
    try {
      const colaborador = await firstValueFrom(this.http.get<Colaborador>(`${API_BASE}/me`));
      this.currentUser.set(colaborador);
    } catch (e) {
      // Cuenta de Microsoft válida pero sin Colaborador dado de alta (o
      // desactivado) — no es un error de red, hay que decírselo a la persona
      // en vez de solo mandarla de vuelta a un login que ya no existe.
      this.error.set(extraerMensajeError(e));
      this.currentUser.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
