import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  EstadoValue,
  PrioridadValue,
  Ticket,
  TicketCreateDto,
  TicketEvento,
} from '../models/ticket.model';
import { API_ROOT, extraerMensajeError } from './api.util';

const API_BASE = `${API_ROOT}/tickets`;

// Guarda hasta qué id de ticket ya "vio" este navegador — no hay backend de
// notificaciones, así que el marcador vive en localStorage (persiste entre
// recargas, pero es local a este navegador/perfil).
const CLAVE_ULTIMO_VISTO = 'ts_ultimo_ticket_visto';

function leerUltimoVisto(): number | null {
  if (typeof localStorage === 'undefined') return null;
  const crudo = localStorage.getItem(CLAVE_ULTIMO_VISTO);
  return crudo ? Number(crudo) : null;
}

function guardarUltimoVisto(id: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CLAVE_ULTIMO_VISTO, String(id));
}

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private http = inject(HttpClient);

  // Estado compartido: cualquier componente que inyecte este servicio
  // lee/reacciona a los mismos signals, sin necesidad de un store aparte.
  readonly tickets = signal<Ticket[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // null = todavía no se sabe cuáles son "nuevos" (antes de la primera
  // carga); se resuelve marcando como vistos los tickets ya existentes.
  private readonly ultimoVistoId = signal<number | null>(leerUltimoVisto());

  readonly nuevos = computed(() => {
    const visto = this.ultimoVistoId();
    if (visto === null) return [];
    return this.tickets()
      .filter((t) => t.id > visto)
      .sort((a, b) => +new Date(b.creado) - +new Date(a.creado));
  });

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<Ticket[]>(API_BASE));
      this.tickets.set(data);
      // Primera carga de la sesión: los tickets que ya existían no cuentan
      // como "nuevos" para notificar.
      if (this.ultimoVistoId() === null) this.marcarTodosVistos();
    } catch (e) {
      this.error.set(extraerMensajeError(e));
    } finally {
      this.loading.set(false);
    }
  }

  marcarTodosVistos(): void {
    const maxId = this.tickets().reduce((max, t) => Math.max(max, t.id), 0);
    this.ultimoVistoId.set(maxId);
    guardarUltimoVisto(maxId);
  }

  async crear(dto: TicketCreateDto): Promise<Ticket> {
    const nuevo = await firstValueFrom(this.http.post<Ticket>(API_BASE, dto));
    this.tickets.update((lista) => [...lista, nuevo]);
    // Quien crea el ticket ya lo conoce: no hace falta notificárselo a
    // sí mismo en su propio navegador.
    if ((this.ultimoVistoId() ?? 0) < nuevo.id) {
      this.ultimoVistoId.set(nuevo.id);
      guardarUltimoVisto(nuevo.id);
    }
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

  // Sin signal propio: el historial es específico de un ticket y solo lo
  // necesita ticket-detail mientras está expandido, no todo el listado.
  async obtenerHistorial(id: number): Promise<TicketEvento[]> {
    return firstValueFrom(this.http.get<TicketEvento[]>(`${API_BASE}/${id}/historial`));
  }

  async agregarComentario(id: number, texto: string): Promise<TicketEvento> {
    return firstValueFrom(this.http.post<TicketEvento>(`${API_BASE}/${id}/comentarios`, { texto }));
  }

  private reemplazar(actualizado: Ticket): void {
    this.tickets.update((lista) =>
      lista.map((t) => (t.id === actualizado.id ? actualizado : t))
    );
  }
}
