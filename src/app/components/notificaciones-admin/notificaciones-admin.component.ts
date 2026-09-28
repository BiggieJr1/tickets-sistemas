import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TicketsService } from '../../services/tickets.service';

@Component({
  selector: 'app-notificaciones-admin',
  standalone: true,
  templateUrl: './notificaciones-admin.component.html',
})
export class NotificacionesAdminComponent {
  protected ticketsService = inject(TicketsService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  readonly abierto = signal(false);

  toggle(): void {
    this.abierto.update((v) => !v);
  }

  // Cierra el dropdown al hacer clic fuera del componente.
  @HostListener('document:click', ['$event'])
  onClickFuera(evento: MouseEvent): void {
    if (this.abierto() && !this.elementRef.nativeElement.contains(evento.target)) {
      this.abierto.set(false);
    }
  }

  irATickets(): void {
    this.abierto.set(false);
    this.ticketsService.marcarTodosVistos();
    this.router.navigateByUrl('/tickets');
  }
}
