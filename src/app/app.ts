import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected auth = inject(AuthService);

  // logout() navega fuera de la app (logout de Microsoft) y de vuelta —
  // no hace falta un navigateByUrl aparte.
  salir(): void {
    this.auth.logout();
  }
}
