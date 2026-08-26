import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CATEGORIAS,
  ESTADOS,
  EstadoValue,
  PRIORIDADES,
  PrioridadValue,
  Ticket,
  labelDe,
} from '../../models/ticket.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent {
  // input.required(): este componente no tiene sentido sin un ticket.
  readonly ticket = input.required<Ticket>();

  // Outputs simples: el componente no llama al servicio directamente,
  // deja que el contenedor (ticket-list) decida qué hacer — más fácil
  // de testear y de reusar en otro contexto.
  readonly estadoChange = output<EstadoValue>();
  readonly prioridadChange = output<PrioridadValue>();
  readonly eliminar = output<void>();

  readonly categorias = CATEGORIAS;
  readonly prioridades = PRIORIDADES;
  readonly estados = ESTADOS;
  readonly labelDe = labelDe;

  confirmarEliminar(): void {
    if (confirm('¿Eliminar este ticket? Esta acción no se puede deshacer.')) {
      this.eliminar.emit();
    }
  }
}
