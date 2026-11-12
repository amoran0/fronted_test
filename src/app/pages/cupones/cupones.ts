import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Aviso, ResultadoOperacion } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { TarjetaIndicador } from '../../components/tarjeta-indicador/tarjeta-indicador';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { CampoBusqueda } from '../../components/campo-busqueda/campo-busqueda';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { Cupon } from '../../models/cupon';
import { ServicioCupones } from '../../services/servicio-cupones';
import { formatearEuros, formatearFechaCorta, fechaHoyIso } from '../../utils/formato';
import { esCodigoCuponValido } from '../../utils/validaciones';

/** Validador de grupo: fechas coherentes y email obligatorio si el cupón es personal. */
function reglasCupon(grupoFormulario: AbstractControl): ValidationErrors | null {
  const { desde, hasta, destinatario, email } = grupoFormulario.value;
  const errores: ValidationErrors = {};
  if (desde && hasta && hasta < desde) errores['fechas'] = true;
  if (destinatario === 'personal' && !email) errores['emailRequerido'] = true;
  return Object.keys(errores).length ? errores : null;
}

@Component({
  selector: 'app-pagina-cupones',
  imports: [
    ReactiveFormsModule,
    CabeceraPagina,
    TarjetaIndicador,
    CampoBusqueda,
    EtiquetaEstado,
    Aviso,
    Icono,
    RouterLink,
  ],
  templateUrl: './cupones.html',
  styleUrl: './cupones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaCupones {
  protected readonly servicioCupones = inject(ServicioCupones);
  protected readonly formatearEuros = formatearEuros;

  protected readonly textoBusqueda = signal('');
  protected readonly mensaje = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  /** Código del cupón que se está editando; `null` al crear uno nuevo. */
  protected readonly codigoEnEdicion = signal<string | null>(null);

  protected readonly cuponesFiltrados = computed(() => {
    const busqueda = this.textoBusqueda().trim().toUpperCase();
    return this.servicioCupones
      .cupones()
      .filter(
        (cupon) =>
          !busqueda ||
          cupon.codigo.includes(busqueda) ||
          cupon.descripcion.toUpperCase().includes(busqueda),
      );
  });

  protected readonly formulario = inject(FormBuilder).nonNullable.group(
    {
      codigo: [
        '',
        [
          Validators.required,
          (control: AbstractControl) =>
            control.value && !esCodigoCuponValido(control.value) ? { formato: true } : null,
        ],
      ],
      valor: [10, [Validators.required, Validators.min(1)]],
      tipo: ['porcentaje' as Cupon['tipo']],
      usosMax: [100, [Validators.required, Validators.min(1)]],
      desde: [fechaHoyIso(), Validators.required],
      hasta: [''],
      destinatario: ['publico' as 'publico' | 'personal'],
      minimoCompra: [0, [Validators.min(0)]],
      activo: [true],
      email: ['', Validators.email],
    },
    { validators: reglasCupon },
  );
  private readonly estadoFormulario = toSignal(this.formulario.statusChanges, {
    initialValue: this.formulario.status,
  });
  protected readonly formularioValido = computed(() => this.estadoFormulario() === 'VALID');

  protected textoVigencia(cupon: Cupon): string {
    if (!cupon.hasta) return 'Sin caducidad';
    return cupon.desde > fechaHoyIso()
      ? `${formatearFechaCorta(cupon.desde)} — ${formatearFechaCorta(cupon.hasta)}`
      : `Hasta ${formatearFechaCorta(cupon.hasta)}`;
  }

  /** Carga un cupón existente en el formulario para modificarlo. */
  protected editarCupon(cupon: Cupon): void {
    this.mensaje.set(null);
    this.error.set(null);
    this.codigoEnEdicion.set(cupon.codigo);
    this.formulario.reset({
      codigo: cupon.codigo,
      valor: cupon.valor,
      tipo: cupon.tipo,
      usosMax: cupon.usosMax,
      desde: cupon.desde,
      hasta: cupon.hasta ?? '',
      destinatario: cupon.email ? 'personal' : 'publico',
      minimoCompra: cupon.minimoCompra,
      activo: cupon.activo,
      email: cupon.email ?? '',
    });
    this.irAlFormulario();
  }

  protected empezarCuponNuevo(): void {
    this.mensaje.set(null);
    this.error.set(null);
    this.codigoEnEdicion.set(null);
    this.formulario.reset();
    this.irAlFormulario();
  }

  /** Lleva el formulario a la vista (en pantallas estrechas queda debajo de la lista). */
  private irAlFormulario(): void {
    const formularioCupon = document.getElementById('nuevo-cupon');
    formularioCupon?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    formularioCupon
      ?.querySelector<HTMLInputElement>('input:not([readonly])')
      ?.focus({ preventScroll: true });
  }

  protected guardarCupon(): void {
    this.mensaje.set(null);
    this.error.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const codigo = valores.codigo.trim().toUpperCase();
    const textoDestinatario =
      valores.destinatario === 'personal' ? valores.email : 'todos los productos';
    const textoDescuento =
      valores.tipo === 'porcentaje' ? valores.valor + ' %' : formatearEuros(valores.valor);
    const textoMinimo = valores.minimoCompra
      ? ' · mín. ' + formatearEuros(valores.minimoCompra)
      : '';
    const cupon: Cupon = {
      codigo,
      tipo: valores.tipo,
      valor: valores.valor,
      descripcion: `${textoDescuento} · ${textoDestinatario}${textoMinimo}`,
      desde: valores.desde,
      hasta: valores.hasta || null,
      usos: this.codigoEnEdicion() ? (this.servicioCupones.buscar(codigo)?.usos ?? 0) : 0,
      usosMax: valores.usosMax,
      minimoCompra: valores.minimoCompra,
      email: valores.destinatario === 'personal' ? valores.email : undefined,
      activo: valores.activo,
    };
    const esEdicion = !!this.codigoEnEdicion();
    (esEdicion
      ? this.servicioCupones.actualizar(cupon)
      : this.servicioCupones.crear(cupon)
    ).subscribe({
      next: () => {
        this.mensaje.set(`Cupón ${codigo} ${esEdicion ? 'actualizado' : 'creado'}.`);
        this.codigoEnEdicion.set(null);
        this.formulario.reset();
      },
      error: (errorGuardado: Error) => this.error.set(errorGuardado.message),
    });
  }

  /** Mensaje de la última eliminación (éxito o error), mostrado sobre la lista. */
  protected readonly resultadoEliminacion = signal<ResultadoOperacion | null>(null);

  protected eliminarCupon(cupon: Cupon): void {
    if (!confirm(`¿Eliminar el cupón ${cupon.codigo}? Esta acción no se puede deshacer.`)) return;
    this.resultadoEliminacion.set(null);
    this.servicioCupones.eliminar(cupon.codigo).subscribe({
      next: () => {
        if (this.codigoEnEdicion() === cupon.codigo) this.empezarCuponNuevo();
        this.resultadoEliminacion.set({ tono: 'exito', texto: `Cupón ${cupon.codigo} eliminado.` });
      },
      error: (errorEliminando: Error) =>
        this.resultadoEliminacion.set({ tono: 'peligro', texto: errorEliminando.message }),
    });
  }

  protected campoInvalido(nombreCampo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[nombreCampo];
    return control.touched && control.invalid;
  }
}
