import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CATEGORIA_CODIGO,
  EstadoValue,
  PRIORIDADES,
  PrioridadValue,
  Ticket,
  labelDe,
} from '../../models/ticket.model';
import { TicketDetailComponent } from '../ticket-detail/ticket-detail.component';

@Component({
  selector: 'app-ticket-row',
  standalone: true,
  imports: [DatePipe, TicketDetailComponent],
  templateUrl: './ticket-row.component.html',
  styleUrl: './ticket-row.component.scss',
})
export class TicketRowComponent {
  readonly ticket = input.required<Ticket>();
  readonly expandido = input(false);

  readonly toggle = output<void>();
  readonly estadoChange = output<EstadoValue>();
  readonly prioridadChange = output<PrioridadValue>();
  readonly eliminar = output<void>();

  readonly categoriaCodigo = CATEGORIA_CODIGO;
  readonly labelDe = labelDe;
  readonly prioridades = PRIORIDADES;

  claseBordePrioridad(): string {
    return 'p-' + this.ticket().prioridad.toLowerCase();
  }

  claseBadgePrioridad(): string {
    return 'prio-' + this.ticket().prioridad.toLowerCase();
  }
}
