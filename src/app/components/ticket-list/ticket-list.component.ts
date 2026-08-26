import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  EstadoValue,
  PRIORIDAD_ORDEN,
  PrioridadValue,
} from '../../models/ticket.model';
import { TicketsService } from '../../services/tickets.service';
import { TicketFilterBarComponent } from '../ticket-filter-bar/ticket-filter-bar.component';
import { TicketRowComponent } from '../ticket-row/ticket-row.component';
import { NewTicketModalComponent } from '../new-ticket-modal/new-ticket-modal.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [TicketFilterBarComponent, TicketRowComponent, NewTicketModalComponent],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.scss',
})
export class TicketListComponent implements OnInit {
  protected ticketsService = inject(TicketsService);

  // Estado de filtros (bindeado bidireccionalmente por ticket-filter-bar)
  readonly busqueda = signal('');
  readonly categoria = signal('');
  readonly prioridad = signal('');
  readonly estado = signal('');

  // Qué ticket está expandido y si el modal de "nuevo" está abierto
  readonly idExpandido = signal<number | null>(null);
  readonly modalAbierto = signal(false);

  // computed(): se recalcula solo cuando cambian los signals que usa
  // (tickets, busqueda, categoria, prioridad, estado) — nada de
  // funciones "getFiltered()" llamadas manualmente desde el template.
  readonly ticketsFiltrados = computed(() => {
    const busq = this.busqueda().trim().toLowerCase();
    const cat = this.categoria();
    const prio = this.prioridad();
    const est = this.estado();

    return this.ticketsService
      .tickets()
      .filter((t) => !busq || t.titulo.toLowerCase().includes(busq))
      .filter((t) => !cat || t.categoria === cat)
      .filter((t) => !prio || t.prioridad === prio)
      .filter((t) => !est || t.estado === est)
      .sort((a, b) => {
        const diff = PRIORIDAD_ORDEN[a.prioridad] - PRIORIDAD_ORDEN[b.prioridad];
        return diff !== 0 ? diff : +new Date(b.creado) - +new Date(a.creado);
      });
  });

  ngOnInit(): void {
    this.ticketsService.cargar();
  }

  toggleExpandido(id: number): void {
    this.idExpandido.set(this.idExpandido() === id ? null : id);
  }

  onEstadoChange(id: number, estado: EstadoValue): void {
    this.ticketsService.cambiarEstado(id, estado);
  }

  onPrioridadChange(id: number, prioridad: PrioridadValue): void {
    this.ticketsService.cambiarPrioridad(id, prioridad);
  }

  onEliminar(id: number): void {
    this.ticketsService.eliminar(id);
    if (this.idExpandido() === id) this.idExpandido.set(null);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }
}
