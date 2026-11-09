import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Aviso } from '../../componentes/aviso/aviso';
import { Icono } from '../../componentes/icono/icono';
import { CabeceraPagina } from '../../componentes/cabecera-pagina/cabecera-pagina';
import { ServicioAutenticacion, INICIO_POR_ROL } from '../../servicios/servicio-autenticacion';
import { USUARIOS_SIMULADOS } from '../../servicios/datos-simulados';
import { entorno } from '../../../entornos/entorno';

@Component({
  selector: 'app-pagina-acceder',
  imports: [ReactiveFormsModule, CabeceraPagina, Aviso, Icono],
  templateUrl: './acceder.html',
  styleUrl: './acceder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAcceder {
  /** Ruta a la que volver tras iniciar sesión (query param `volver`). */
  readonly volver = input<string>();

  private readonly autenticacion = inject(ServicioAutenticacion);
  private readonly enrutador = inject(Router);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Accesos de demostración: solo con datos de ejemplo. */
  protected readonly usuariosDemostracion = entorno.usarDatosSimulados ? USUARIOS_SIMULADOS : [];
  protected readonly etiquetaPorRol = { cliente: 'Cliente', barista: 'Barista', admin: 'Admin' };

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.autenticacion.iniciarSesion(this.formulario.getRawValue()).subscribe({
      next: (sesion) => this.enrutador.navigateByUrl(this.volver() || INICIO_POR_ROL[sesion.usuario.rol]),
      error: (errorInicio: Error) => {
        this.error.set(errorInicio.message || 'No se ha podido iniciar sesión.');
        this.enviando.set(false);
      },
    });
  }

  /** Rellena el formulario con un usuario de demostración y entra. */
  protected entrarComo(email: string, contrasena: string): void {
    this.formulario.setValue({ email, contrasena });
    this.enviar();
  }
}
