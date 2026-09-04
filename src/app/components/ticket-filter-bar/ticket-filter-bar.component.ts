import { Component, computed, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS, ESTADOS, PRIORIDADES } from '../../models/ticket.model';

@Component({
  selector: 'app-ticket-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ticket-filter-bar.component.html',
  styleUrl: './ticket-filter-bar.component.scss',
})
export class TicketFilterBarComponent {
  // model() crea un signal con binding bidireccional: el padre lo usa como
  // [(busqueda)]="busqueda", sin necesidad de @Input + @Output por separado.
  readonly busqueda = model('');
  readonly categoria = model('');
  readonly prioridad = model('');
  readonly estado = model('');

  readonly categorias = CATEGORIAS;
  readonly prioridades = PRIORIDADES;
  readonly estados = ESTADOS;

  readonly hayFiltrosActivos = computed(
    () => !!(this.busqueda() || this.categoria() || this.prioridad() || this.estado())
  );

  limpiar(): void {
    this.busqueda.set('');
    this.categoria.set('');
    this.prioridad.set('');
    this.estado.set('');
  }
}
