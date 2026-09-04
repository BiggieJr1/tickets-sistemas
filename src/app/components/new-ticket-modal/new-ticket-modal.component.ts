import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIAS, PRIORIDADES } from '../../models/ticket.model';
import { TicketsService, extraerMensajeError } from '../../services/tickets.service';

@Component({
  selector: 'app-new-ticket-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-ticket-modal.component.html',
  styleUrl: './new-ticket-modal.component.scss',
})
export class NewTicketModalComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private ticketsService = inject(TicketsService);

  @ViewChild('primerCampo') private primerCampo?: ElementRef<HTMLInputElement>;

  readonly cerrar = output<void>();

  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly categorias = CATEGORIAS;
  readonly prioridades = PRIORIDADES;

  private readonly overflowPrevio = typeof document !== 'undefined' ? document.body.style.overflow : '';

  ngAfterViewInit(): void {
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    this.primerCampo?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') document.body.style.overflow = this.overflowPrevio;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrar.emit();
  }

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
      this.error.set(extraerMensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
