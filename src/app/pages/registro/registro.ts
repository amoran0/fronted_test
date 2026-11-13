import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { INICIO_POR_ROL, ServicioAutenticacion } from '../../services/servicio-autenticacion';
import { esContrasenaSegura, esDniValido } from '../../utils/validaciones';

/** Validador de grupo: las dos contraseñas deben coincidir. */
function contrasenasIguales(grupoFormulario: AbstractControl): ValidationErrors | null {
  const { contrasena, repetirContrasena } = grupoFormulario.value;
  return contrasena && repetirContrasena && contrasena !== repetirContrasena
    ? { contrasenasDistintas: true }
    : null;
}

/** Alta de clientes. Al registrarse, la sesión queda iniciada. */
@Component({
  selector: 'app-pagina-registro',
  imports: [ReactiveFormsModule, CabeceraPagina, Aviso, Icono, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaRegistro {
  private readonly autenticacion = inject(ServicioAutenticacion);
  private readonly enrutador = inject(Router);

  protected readonly formulario = inject(FormBuilder).nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      dni: [
        '',
        [
          Validators.required,
          (control: AbstractControl) =>
            control.value && !esDniValido(control.value) ? { dni: true } : null,
        ],
      ],
      contrasena: [
        '',
        [
          Validators.required,
          (control: AbstractControl) =>
            control.value && !esContrasenaSegura(control.value) ? { debil: true } : null,
        ],
      ],
      repetirContrasena: ['', Validators.required],
    },
    { validators: contrasenasIguales },
  );
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected campoInvalido(nombreCampo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[nombreCampo];
    return control.touched && control.invalid;
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const { nombre, email, dni, contrasena } = this.formulario.getRawValue();
    this.autenticacion.registrar({ nombre, email, dni, contrasena }).subscribe({
      next: (sesion) => this.enrutador.navigateByUrl(INICIO_POR_ROL[sesion.usuario.rol]),
      error: (errorRegistro: Error) => {
        this.error.set(errorRegistro.message || 'No se ha podido crear la cuenta.');
        this.enviando.set(false);
      },
    });
  }
}
