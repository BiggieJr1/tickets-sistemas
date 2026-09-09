import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Colaborador } from '../../models/colaborador.model';
import { extraerMensajeError } from '../../services/api.util';
import { ColaboradoresService } from '../../services/colaboradores.service';

@Component({
  selector: 'app-colaborador-list',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './colaborador-list.component.html',
  styleUrl: './colaborador-list.component.scss',
})
export class ColaboradorListComponent implements OnInit {
  protected colaboradoresService = inject(ColaboradoresService);
  private fb = inject(FormBuilder);

  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
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
      this.form.reset({ nombreCompleto: '', email: '', esAdministrador: false });
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
}
