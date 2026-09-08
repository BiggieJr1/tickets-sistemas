import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  EstadoValue,
  PrioridadValue,
  Ticket,
  TicketCreateDto,
} from '../models/ticket.model';
import { API_ROOT, extraerMensajeError } from './api.util';

const API_BASE = `${API_ROOT}/tickets`;

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
      this.error.set(extraerMensajeError(e));
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

  async asignar(id: number, colaboradorId: number | null): Promise<void> {
    this.error.set(null);
    try {
      const actualizado = await firstValueFrom(
        this.http.patch<Ticket>(`${API_BASE}/${id}/asignacion`, { colaboradorId })
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
}
