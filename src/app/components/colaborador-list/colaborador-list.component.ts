import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Colaborador } from '../../models/colaborador.model';
import { extraerMensajeError } from '../../services/api.util';
import { ColaboradoresService } from '../../services/colaboradores.service';

@Component({
  selector: 'app-colaborador-list',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './colaborador-list.component.html',
  styleUrl: './colaborador-list.component.scss',
})
export class ColaboradorListComponent implements OnInit {
  protected colaboradoresService = inject(ColaboradoresService);
  private fb = inject(FormBuilder);

  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  // Fila cuya contraseña se está reseteando (inline, sin modal aparte).
  readonly resetId = signal<number | null>(null);
  readonly resetPassword = signal('');
  readonly reseteando = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    esAdministrador: [false],
  });

  ngOnInit(): void {
    this.colaboradoresService.cargar();
  }

  async crear(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.colaboradoresService.crear(this.form.getRawValue());
      this.modalAbierto.set(false);
      this.form.reset({ nombreCompleto: '', email: '', password: '', esAdministrador: false });
    } catch (e) {
      this.error.set(extraerMensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  toggleAdmin(c: Colaborador): Promise<void> {
    return this.actualizar(c, { esAdministrador: !c.esAdministrador });
  }

  toggleActivo(c: Colaborador): Promise<void> {
    return this.actualizar(c, { activo: !c.activo });
  }

  private async actualizar(c: Colaborador, cambios: Partial<Colaborador>): Promise<void> {
    this.error.set(null);
    try {
      await this.colaboradoresService.actualizar(c.id, {
        nombreCompleto: c.nombreCompleto,
        email: c.email,
        esAdministrador: c.esAdministrador,
        activo: c.activo,
        ...cambios,
      });
    } catch (e) {
      this.error.set(extraerMensajeError(e));
    }
  }

  iniciarReset(id: number): void {
    this.resetId.set(id);
    this.resetPassword.set('');
  }

  cancelarReset(): void {
    this.resetId.set(null);
  }

  async confirmarReset(id: number): Promise<void> {
    const password = this.resetPassword().trim();
    if (password.length < 8) return;

    this.reseteando.set(true);
    this.error.set(null);
    try {
      await this.colaboradoresService.resetearPassword(id, password);
      this.resetId.set(null);
    } catch (e) {
      this.error.set(extraerMensajeError(e));
    } finally {
      this.reseteando.set(false);
    }
  }
}
