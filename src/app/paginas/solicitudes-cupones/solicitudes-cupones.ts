import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Aviso } from '../../componentes/aviso/aviso';
import { Icono } from '../../componentes/icono/icono';
import { CabeceraPagina } from '../../componentes/cabecera-pagina/cabecera-pagina';
import { ResultadoValidacion } from '../../modelos/cupon';
import { ServicioCupones } from '../../servicios/servicio-cupones';
import { calcularTotal } from '../../utilidades/calculos';
import { formatearEuros, fechaHoyIso } from '../../utilidades/formato';

/** Cupones generados a petición de CineTown y comprobador manual de cupones. */
@Component({
  selector: 'app-pagina-solicitudes-cupones',
  imports: [ReactiveFormsModule, CabeceraPagina, Aviso, Icono, RouterLink],
  templateUrl: './solicitudes-cupones.html',
  styleUrl: './solicitudes-cupones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaSolicitudesCupones {
  private readonly servicioCupones = inject(ServicioCupones);
  private readonly constructorFormularios = inject(FormBuilder).nonNullable;
  protected readonly formatearEuros = formatearEuros;

  protected readonly formularioSolicitud = this.constructorFormularios.group({
    referencia: ['CT2026-1048', Validators.required],
    codigo: ['CINE5', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{4,16}$/)]],
    descuentoFijo: [5, [Validators.required, Validators.min(1)]],
    desde: [fechaHoyIso(), Validators.required],
    hasta: [fechaHoyIso(new Date(Date.now() + 19 * 86400000)), Validators.required],
    usosMax: [1, [Validators.required, Validators.min(1)]],
    minimoCompra: [15, Validators.min(0)],
    email: ['marta.r@example.com', [Validators.required, Validators.email]],
  });
  protected readonly resumenCuponGenerado = signal<string | null>(null);
  protected readonly errorGeneracion = signal<string | null>(null);

  protected readonly formularioComprobacion = this.constructorFormularios.group({
    codigo: ['MARTA5', Validators.required],
    importe: [18.5, [Validators.required, Validators.min(0)]],
    fecha: [fechaHoyIso(), Validators.required],
    email: ['marta.r@example.com', Validators.email],
  });
  protected readonly resultadoComprobacion = signal<(ResultadoValidacion & { total: number }) | null>(null);

  protected generarCupon(): void {
    this.resumenCuponGenerado.set(null);
    this.errorGeneracion.set(null);
    if (this.formularioSolicitud.invalid) {
      this.formularioSolicitud.markAllAsTouched();
      return;
    }
    const datosSolicitud = this.formularioSolicitud.getRawValue();
    this.servicioCupones.generarParaSolicitud({ ...datosSolicitud, recibida: fechaHoyIso() }).subscribe({
      next: (cuponGenerado) =>
        this.resumenCuponGenerado.set(
          `Cupón personal de ${formatearEuros(cuponGenerado.valor)} · activo · 0/${cuponGenerado.usosMax} usos · ` +
            `mínimo ${formatearEuros(cuponGenerado.minimoCompra)} · para ${cuponGenerado.email}.`,
        ),
      error: (errorGenerando: Error) => this.errorGeneracion.set(errorGenerando.message),
    });
  }

  protected comprobarCupon(): void {
    if (this.formularioComprobacion.invalid) {
      this.formularioComprobacion.markAllAsTouched();
      return;
    }
    const datosComprobacion = this.formularioComprobacion.getRawValue();
    const validacion = this.servicioCupones.validar(datosComprobacion.codigo, {
      subtotal: datosComprobacion.importe,
      email: datosComprobacion.email,
      fecha: new Date(datosComprobacion.fecha + 'T12:00'),
    });
    const descuentoAplicado = validacion.valido
      ? { tipo: 'cupon' as const, etiqueta: '', importe: validacion.descuento! }
      : null;
    this.resultadoComprobacion.set({ ...validacion, total: calcularTotal(datosComprobacion.importe, descuentoAplicado) });
  }
}
