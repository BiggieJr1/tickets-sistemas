import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  EstadoValue,
  PrioridadValue,
  Ticket,
  TicketCreateDto,
} from '../models/ticket.model';

// Ajusta esto si la API no queda detrás de un proxy /api en el mismo dominio
// (en dev, configúralo en proxy.conf.json de Angular CLI).
const API_BASE = '/api/tickets';

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
    const actualizado = await firstValueFrom(
      this.http.patch<Ticket>(`${API_BASE}/${id}/estado`, { estado })
    );
    this.reemplazar(actualizado);
  }

  async cambiarPrioridad(id: number, prioridad: PrioridadValue): Promise<void> {
    const actualizado = await firstValueFrom(
      this.http.patch<Ticket>(`${API_BASE}/${id}/prioridad`, { prioridad })
    );
    this.reemplazar(actualizado);
  }

  async eliminar(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${API_BASE}/${id}`));
    this.tickets.update((lista) => lista.filter((t) => t.id !== id));
  }

  private reemplazar(actualizado: Ticket): void {
    this.tickets.update((lista) =>
      lista.map((t) => (t.id === actualizado.id ? actualizado : t))
    );
  }

  private mensajeError(e: unknown): string {
    if (e instanceof Object && 'message' in e) return String((e as any).message);
    return 'No se pudo conectar con la API.';
  }
}
