import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIAS, PRIORIDADES } from '../../models/ticket.model';
import { TicketsService } from '../../services/tickets.service';

@Component({
  selector: 'app-new-ticket-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-ticket-modal.component.html',
  styleUrl: './new-ticket-modal.component.scss',
})
export class NewTicketModalComponent {
  private fb = inject(FormBuilder);
  private ticketsService = inject(TicketsService);

  readonly cerrar = output<void>();

  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly categorias = CATEGORIAS;
  readonly prioridades = PRIORIDADES;

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.required, Validators.maxLength(4000)]],
    categoria: [this.categorias[0].value, Validators.required],
    prioridad: [this.prioridades[0].value, Validators.required],
    solicitante: [''],
  });

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    const valores = this.form.getRawValue();

    try {
      await this.ticketsService.crear({
        titulo: valores.titulo.trim(),
        descripcion: valores.descripcion.trim(),
        categoria: valores.categoria,
        prioridad: valores.prioridad,
        solicitante: valores.solicitante.trim() || null,
      });
      this.cerrar.emit();
    } catch (e) {
      this.error.set('No se pudo guardar el ticket. Intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
}
