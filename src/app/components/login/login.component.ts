import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // MSAL, al volver del redirect de Microsoft, restaura la página en la
    // que estabas antes de darle clic al botón — que es esta misma
    // (/login). Si para entonces ya hay sesión (el appInitializer ya
    // corrió restoreSession()), hay que mandar a /tickets de una vez.
    if (this.auth.currentUser()) {
      this.router.navigateByUrl('/tickets');
    }
  }

  // Sin cuenta de Microsoft, o con una que no está dada de alta aquí — en
  // ambos casos el botón hace lo mismo: iniciar el login por redirect.
  entrar(): void {
    this.auth.login();
  }

  cerrarSesion(): void {
    this.auth.logout();
  }
}
