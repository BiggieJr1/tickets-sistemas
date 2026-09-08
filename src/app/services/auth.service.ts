import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Colaborador, LoginDto, LoginResponseDto } from '../models/colaborador.model';
import { API_ROOT, extraerMensajeError } from './api.util';

const STORAGE_KEY = 'ticketsAuthToken';
const API_BASE = `${API_ROOT}/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly currentUser = signal<Colaborador | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isAdmin = computed(() => this.currentUser()?.esAdministrador ?? false);

  get token(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  async login(dto: LoginDto): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.http.post<LoginResponseDto>(`${API_BASE}/login`, dto));
      this.guardarSesion(res);
    } catch (e) {
      this.error.set(extraerMensajeError(e));
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage no disponible (modo privado, etc.): no es crítico. */
    }
    this.currentUser.set(null);
  }

  // Se llama una sola vez al arrancar la app (provideAppInitializer en
  // app.config.ts) para que el router espere a que esto termine antes de
  // resolver la primera ruta — si no, los guards verían currentUser() en
  // null todavía y mandarían al login a alguien que sigue con sesión activa.
  async restoreSession(): Promise<void> {
    const token = this.token;
    if (!token) return;

    try {
      const colaborador = await firstValueFrom(this.http.get<Colaborador>(`${API_BASE}/me`));
      this.currentUser.set(colaborador);
    } catch {
      this.logout();
    }
  }

  private guardarSesion(res: LoginResponseDto): void {
    try {
      localStorage.setItem(STORAGE_KEY, res.token);
    } catch {
      /* localStorage no disponible: la sesión no sobrevive un refresh, pero
         el login en curso sigue funcionando (currentUser ya queda en memoria). */
    }
    this.currentUser.set(res.colaborador);
  }
}
