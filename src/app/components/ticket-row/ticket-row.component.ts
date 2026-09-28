import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Colaborador } from '../../models/colaborador.model';
import {
  CATEGORIA_CODIGO,
  ESTADOS,
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
  host: { class: 'block' },
})
export class TicketRowComponent {
  readonly ticket = input.required<Ticket>();
  readonly expandido = input(false);
  readonly colaboradores = input<Colaborador[]>([]);

  protected get detalleId(): string {
    return `detalle-${this.ticket().id}`;
  }

  readonly toggle = output<void>();
  readonly estadoChange = output<EstadoValue>();
  readonly prioridadChange = output<PrioridadValue>();
  readonly asignacionChange = output<number | null>();
  readonly eliminar = output<void>();

  readonly categoriaCodigo = CATEGORIA_CODIGO;
  readonly labelDe = labelDe;
  readonly prioridades = PRIORIDADES;
  readonly estados = ESTADOS;

  claseBordePrioridad(): string {
    return BORDE_PRIORIDAD[this.ticket().prioridad];
  }

  claseBadgePrioridad(): string {
    return BADGE_PRIORIDAD[this.ticket().prioridad];
  }
}

// Clases completas (no armadas con concatenación) para que Tailwind las
// encuentre al escanear el código y genere su CSS.
const BORDE_PRIORIDAD: Record<PrioridadValue, string> = {
  Critica: 'border-l-crit',
  Alta: 'border-l-alta',
  Media: 'border-l-media',
  Baja: 'border-l-baja',
  SinAsignar: 'border-l-accent',
};

const BADGE_PRIORIDAD: Record<PrioridadValue, string> = {
  Critica: 'bg-crit/14 text-crit',
  Alta: 'bg-alta/14 text-alta',
  Media: 'bg-media/14 text-media',
  Baja: 'bg-baja/16 text-baja',
  SinAsignar: 'bg-accent/14 text-accent',
};
