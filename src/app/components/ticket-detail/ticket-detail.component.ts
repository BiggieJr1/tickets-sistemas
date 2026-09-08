import { Component, inject, input, output } from '@angular/core';
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

  // Eliminar es solo de administradores (el backend también lo exige; esto
  // evita el "clic y falla con 403" en la interfaz).
  readonly esAdmin = this.auth.isAdmin;

  // input.required(): este componente no tiene sentido sin un ticket.
  readonly ticket = input.required<Ticket>();

  // Colaboradores activos, para poblar el selector "asignar a".
  readonly colaboradores = input<Colaborador[]>([]);

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
