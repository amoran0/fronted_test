import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { ServicioAutenticacion } from '../../services/servicio-autenticacion';
import { ServicioCarrito } from '../../services/servicio-carrito';
import { ServicioPedidos } from '../../services/servicio-pedidos';
import { PipeEuro } from '../../utils/pipe-euro';
import { formatearDescuento } from '../../utils/formato';

@Component({
  selector: 'app-pagina-confirmacion-pedido',
  imports: [CabeceraPagina, Aviso, Icono, EtiquetaEstado, PipeEuro, RouterLink],
  templateUrl: './confirmacion-pedido.html',
  styleUrl: './confirmacion-pedido.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaConfirmacionPedido {
  protected readonly servicioCarrito = inject(ServicioCarrito);
  private readonly servicioPedidos = inject(ServicioPedidos);
  private readonly autenticacion = inject(ServicioAutenticacion);
  private readonly enrutador = inject(Router);

  protected readonly formatearDescuento = formatearDescuento;

  protected readonly codigoCuponEscrito = signal(this.servicioCarrito.codigoCupon() ?? '');
  private readonly errorAlAplicarCupon = signal<string | null>(null);
  /** Error al aplicar el cupón o al revalidarlo cuando cambia el carrito. */
  protected readonly errorCupon = computed(
    () => this.errorAlAplicarCupon() ?? this.servicioCarrito.errorCupon(),
  );
  protected readonly validandoCupon = signal(false);
  protected readonly dniEscrito = signal(
    this.servicioCarrito.dniSocio() ?? this.autenticacion.usuario()?.dniSocio ?? '',
  );
  protected readonly errorDni = signal<string | null>(null);
  protected readonly enviando = signal(false);

  protected readonly cuponAplicado = computed(() => !!this.servicioCarrito.descuentoDeCupon());
  /** El descuento aplicado es el de socio (por ser mayor que el del cupón). */
  protected readonly ganaDescuentoSocio = computed(
    () => this.servicioCarrito.descuento()?.tipo === 'socio',
  );

  /** Valida el código en el servidor (`POST /cupones/validar`); el motivo del rechazo lo da la API. */
  protected aplicarCupon(): void {
    const codigo = this.codigoCuponEscrito().trim().toUpperCase();
    if (!codigo) return;
    this.validandoCupon.set(true);
    this.servicioCarrito.aplicarCupon(codigo).subscribe({
      next: () => {
        this.errorAlAplicarCupon.set(null);
        this.validandoCupon.set(false);
      },
      error: (errorValidacion: Error) => {
        this.errorAlAplicarCupon.set(errorValidacion.message);
        this.validandoCupon.set(false);
      },
    });
  }

  protected quitarCupon(): void {
    this.servicioCarrito.quitarCupon();
    this.codigoCuponEscrito.set('');
    this.errorAlAplicarCupon.set(null);
  }

  protected validarSocio(): void {
    const dniValido = this.servicioCarrito.validarSocio(this.dniEscrito());
    this.errorDni.set(dniValido ? null : 'El DNI no es válido. Revisa los 8 números y la letra.');
  }

  /** Error devuelto al confirmar el pedido (se muestra sobre el botón). */
  protected readonly errorEnvio = signal<string | null>(null);

  protected confirmarPedido(): void {
    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.servicioPedidos.confirmar().subscribe({
      next: () => this.enrutador.navigateByUrl('/mis-pedidos'),
      error: (errorConfirmando: Error) => {
        this.errorEnvio.set(errorConfirmando.message);
        this.enviando.set(false);
      },
    });
  }
}
