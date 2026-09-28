import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Colaborador } from '../../models/colaborador.model';
import {
  CATEGORIAS,
  ESTADOS,
  EstadoValue,
  PRIORIDADES,
  PrioridadValue,
  Ticket,
  TicketEvento,
  labelDe,
} from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';
import { extraerMensajeError } from '../../services/api.util';
import { TicketsService } from '../../services/tickets.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent {
  private auth = inject(AuthService);
  // A diferencia de estado/prioridad/asignación/eliminar (que mutan la lista
  // central de tickets y por eso se delegan al contenedor vía outputs), el
  // historial es de solo lectura/anexo local a este detalle — no hay
  // necesidad de hacerlo pasar por ticket-row/ticket-list.
  private ticketsService = inject(TicketsService);

  // Cambiar estado/prioridad/asignación y eliminar son solo de
  // administradores (el backend también lo exige; esto evita el
  // "clic y falla con 403" en la interfaz).
  readonly esAdmin = this.auth.isAdmin;

  // input.required(): este componente no tiene sentido sin un ticket.
  readonly ticket = input.required<Ticket>();

  // Colaboradores administradores activos, para poblar el selector "asignar a".
  readonly colaboradores = input<Colaborador[]>([]);

  // Si el ticket ya está asignado a alguien que ya no calificaría para
  // asignación (le quitaron el rol de admin, o se desactivó), esa persona no
  // viene en `colaboradores()` — sin esto, el <select> no encontraría su
  // <option> y mostraría "Sin asignar" aunque el ticket siga asignado a esa
  // persona, arriesgando una desasignación accidental. Se agrega como opción
  // extra usando el nombre que ya trae el propio ticket (no hace falta
  // buscarlo en ninguna lista).
  readonly opcionesAsignacion = computed(() => {
    const colaboradores = this.colaboradores();
    const idActual = this.ticket().asignadoAId;
    if (idActual == null || colaboradores.some((c) => c.id === idActual)) {
      return colaboradores;
    }
    const huerfano: Colaborador = {
      id: idActual,
      nombreCompleto: this.ticket().asignadoANombre ?? `Colaborador #${idActual}`,
      email: '',
      esAdministrador: false,
      activo: false,
    };
    return [...colaboradores, huerfano];
  });

  // Outputs simples: el componente no llama al servicio directamente,
  // deja que el contenedor (ticket-list) decida qué hacer — más fácil
  // de testear y de reusar en otro contexto.
  readonly estadoChange = output<EstadoValue>();
  readonly prioridadChange = output<PrioridadValue>();
  readonly asignacionChange = output<number | null>();
  readonly eliminar = output<void>();

  readonly categorias = CATEGORIAS;
  readonly prioridades = PRIORIDADES;
  readonly estados = ESTADOS;
  readonly labelDe = labelDe;

  readonly historial = signal<TicketEvento[]>([]);
  readonly cargandoHistorial = signal(false);
  readonly errorHistorial = signal<string | null>(null);

  readonly comentario = signal('');
  readonly enviandoComentario = signal(false);

  // Cambiar estado/prioridad/asignación pasa por el contenedor, que
  // reemplaza el ticket con la respuesta del servidor (con `actualizado`
  // nuevo) — el backend registra ese cambio como evento, así que al cambiar
  // `actualizado` se vuelve a pedir el historial. El computed intermedio
  // hace que solo cuente un cambio de valor, no un objeto ticket nuevo con
  // los mismos datos (como el que trae el polling de la campanita).
  private readonly actualizado = computed(() => this.ticket().actualizado);

  constructor() {
    effect(() => {
      this.actualizado();
      untracked(() => this.cargarHistorial());
    });
  }

  private async cargarHistorial(): Promise<void> {
    this.cargandoHistorial.set(true);
    this.errorHistorial.set(null);
    try {
      const eventos = await this.ticketsService.obtenerHistorial(this.ticket().id);
      this.historial.set(eventos);
    } catch (e) {
      this.errorHistorial.set(extraerMensajeError(e));
    } finally {
      this.cargandoHistorial.set(false);
    }
  }

  async enviarComentario(): Promise<void> {
    const texto = this.comentario().trim();
    if (!texto) return;

    this.enviandoComentario.set(true);
    this.errorHistorial.set(null);
    try {
      const evento = await this.ticketsService.agregarComentario(this.ticket().id, texto);
      this.historial.update((lista) => [...lista, evento]);
      this.comentario.set('');
    } catch (e) {
      this.errorHistorial.set(extraerMensajeError(e));
    } finally {
      this.enviandoComentario.set(false);
    }
  }

  // Texto legible de un evento automático (los comentarios se muestran
  // aparte, con su propio bloque en la plantilla).
  descripcionEvento(e: TicketEvento): string {
    const quien = e.colaboradorNombre ?? 'Alguien';
    switch (e.tipo) {
      case 'CambioEstado':
        return `${quien} cambió el estado de ${labelDe(this.estados, e.valorAnterior as EstadoValue)} a ${labelDe(this.estados, e.valorNuevo as EstadoValue)}`;
      case 'CambioPrioridad':
        return `${quien} cambió la prioridad de ${labelDe(this.prioridades, e.valorAnterior as PrioridadValue)} a ${labelDe(this.prioridades, e.valorNuevo as PrioridadValue)}`;
      case 'CambioAsignacion':
        return e.valorNuevo === 'Sin asignar'
          ? `${quien} quitó la asignación (antes: ${e.valorAnterior})`
          : `${quien} asignó el ticket a ${e.valorNuevo}`;
      default:
        return '';
    }
  }

  // El <select> nativo solo maneja strings; "" representa "sin asignar".
  onAsignacionChange(valor: string): void {
    this.asignacionChange.emit(valor === '' ? null : Number(valor));
  }

  confirmarEliminar(): void {
    if (confirm('¿Eliminar este ticket? Esta acción no se puede deshacer.')) {
      this.eliminar.emit();
    }
  }
}
