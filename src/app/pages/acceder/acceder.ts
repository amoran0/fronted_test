import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { ServicioAutenticacion, INICIO_POR_ROL } from '../../services/servicio-autenticacion';
import { entorno } from '../../../entornos/entorno';

@Component({
  selector: 'app-pagina-acceder',
  imports: [ReactiveFormsModule, CabeceraPagina, Aviso, Icono, RouterLink],
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
  /** Accesos rápidos con las cuentas del script SQL (solo en desarrollo, ver `entorno`). */
  protected readonly usuariosDemostracion = entorno.cuentasDemostracion;
  protected readonly etiquetaPorRol: Record<string, string> = {
    cliente: 'Cliente',
    barista: 'Barista',
    admin: 'Admin',
  };

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.autenticacion.iniciarSesion(this.formulario.getRawValue()).subscribe({
      next: (sesion) =>
        this.enrutador.navigateByUrl(this.volver() || INICIO_POR_ROL[sesion.usuario.rol]),
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
