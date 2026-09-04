import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, isDevMode, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  EstadoValue,
  PrioridadValue,
  Ticket,
  TicketCreateDto,
} from '../models/ticket.model';

// En desarrollo (`ng serve`) se usa la ruta relativa `/api/tickets`, que
// proxy.conf.json redirige a http://localhost:5080 (tu API corriendo local).
// En producción (build para Netlify) apunta directo a la API pública en Railway.
const API_BASE = isDevMode()
  ? '/api/tickets'
  : 'https://tickets-sistemas-backend-production.up.railway.app/api/tickets';

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

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private http = inject(HttpClient);

  // Estado compartido: cualquier componente que inyecte este servicio
  // lee/reacciona a los mismos signals, sin necesidad de un store aparte.
  readonly tickets = signal<Ticket[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<Ticket[]>(API_BASE));
      this.tickets.set(data);
    } catch (e) {
      this.error.set(this.mensajeError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async crear(dto: TicketCreateDto): Promise<Ticket> {
    const nuevo = await firstValueFrom(this.http.post<Ticket>(API_BASE, dto));
    this.tickets.update((lista) => [...lista, nuevo]);
    return nuevo;
  }

  async cambiarEstado(id: number, estado: EstadoValue): Promise<void> {
    this.error.set(null);
    try {
      const actualizado = await firstValueFrom(
        this.http.patch<Ticket>(`${API_BASE}/${id}/estado`, { estado })
      );
      this.reemplazar(actualizado);
    } catch (e) {
      this.error.set(extraerMensajeError(e));
    }
  }

  async cambiarPrioridad(id: number, prioridad: PrioridadValue): Promise<void> {
    this.error.set(null);
    try {
      const actualizado = await firstValueFrom(
        this.http.patch<Ticket>(`${API_BASE}/${id}/prioridad`, { prioridad })
      );
      this.reemplazar(actualizado);
    } catch (e) {
      this.error.set(extraerMensajeError(e));
    }
  }

  async eliminar(id: number): Promise<void> {
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete<void>(`${API_BASE}/${id}`));
      this.tickets.update((lista) => lista.filter((t) => t.id !== id));
    } catch (e) {
      this.error.set(extraerMensajeError(e));
    }
  }

  private reemplazar(actualizado: Ticket): void {
    this.tickets.update((lista) =>
      lista.map((t) => (t.id === actualizado.id ? actualizado : t))
    );
  }

  private mensajeError(e: unknown): string {
    return extraerMensajeError(e);
  }
}
