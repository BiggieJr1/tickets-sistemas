import { Component, DestroyRef, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { NotificacionesAdminComponent } from './components/notificaciones-admin/notificaciones-admin.component';
import { TicketsService } from './services/tickets.service';

const INTERVALO_POLLING_MS = 30_000;

@Component({
  imports: [RouterOutlet, RouterLink, NotificacionesAdminComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected auth = inject(AuthService);
  private ticketsService = inject(TicketsService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  // logout() navega fuera de la app (logout de Microsoft) y de vuelta —
  // no hace falta un navigateByUrl aparte.
  salir(): void {
    this.auth.logout();
  }

  ngOnInit(): void {
    // Refresca los tickets en segundo plano para que la campana de
    // notificaciones se actualice aunque el admin no esté en /tickets.
    // Solo en el navegador: en SSR no tiene sentido dejar un timer corriendo.
    if (!isPlatformBrowser(this.platformId)) return;
    const id = setInterval(() => {
      if (this.auth.isAdmin()) this.ticketsService.cargar();
    }, INTERVALO_POLLING_MS);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }
}
