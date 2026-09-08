import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tickets',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/ticket-list/ticket-list.component').then(
        (m) => m.TicketListComponent,
      ),
  },
  {
    path: 'colaboradores',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/colaborador-list/colaborador-list.component').then(
        (m) => m.ColaboradorListComponent,
      ),
  },
];
