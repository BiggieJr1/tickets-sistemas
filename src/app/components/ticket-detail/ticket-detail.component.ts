import { Component, computed, inject, input, output } from '@angular/core';
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
  labelDe,
} from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent {
  private auth = inject(AuthService);

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
