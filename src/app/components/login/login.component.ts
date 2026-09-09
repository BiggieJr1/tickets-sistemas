import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  protected auth = inject(AuthService);

  // Sin cuenta de Microsoft, o con una que no está dada de alta aquí — en
  // ambos casos el botón hace lo mismo: iniciar el login por redirect.
  entrar(): void {
    this.auth.login();
  }

  cerrarSesion(): void {
    this.auth.logout();
  }
}
