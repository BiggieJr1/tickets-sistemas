import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Colaborador,
  ColaboradorCreateDto,
  ColaboradorUpdateDto,
} from '../models/colaborador.model';
import { API_ROOT, extraerMensajeError } from './api.util';

const API_BASE = `${API_ROOT}/colaboradores`;

@Injectable({ providedIn: 'root' })
export class ColaboradoresService {
  private http = inject(HttpClient);

  readonly colaboradores = signal<Colaborador[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async cargar(soloActivos = false): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<Colaborador[]>(API_BASE, { params: soloActivos ? { soloActivos: true } : {} })
      );
      this.colaboradores.set(data);
    } catch (e) {
      this.error.set(extraerMensajeError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async crear(dto: ColaboradorCreateDto): Promise<Colaborador> {
    const nuevo = await firstValueFrom(this.http.post<Colaborador>(API_BASE, dto));
    this.colaboradores.update((lista) => [...lista, nuevo]);
    return nuevo;
  }

  async actualizar(id: number, dto: ColaboradorUpdateDto): Promise<Colaborador> {
    const actualizado = await firstValueFrom(this.http.patch<Colaborador>(`${API_BASE}/${id}`, dto));
    this.colaboradores.update((lista) =>
      lista.map((c) => (c.id === actualizado.id ? actualizado : c))
    );
    return actualizado;
  }

  async resetearPassword(id: number, password: string): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${API_BASE}/${id}/password`, { password }));
  }
}
