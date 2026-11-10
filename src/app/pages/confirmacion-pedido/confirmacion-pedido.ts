import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { ServicioAutenticacion } from '../../services/servicio-autenticacion';
import { ServicioCarrito } from '../../services/servicio-carrito';
import { ServicioCupones } from '../../services/servicio-cupones';
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
  private readonly servicioCupones = inject(ServicioCupones);
  private readonly servicioPedidos = inject(ServicioPedidos);
  private readonly autenticacion = inject(ServicioAutenticacion);
  private readonly enrutador = inject(Router);

  protected readonly formatearDescuento = formatearDescuento;

  protected readonly codigoCuponEscrito = signal(this.servicioCarrito.codigoCupon() ?? '');
  protected readonly errorCupon = signal<string | null>(null);
  protected readonly dniEscrito = signal(this.servicioCarrito.dniSocio() ?? this.autenticacion.usuario()?.dniSocio ?? '');
  protected readonly errorDni = signal<string | null>(null);
  protected readonly enviando = signal(false);

  protected readonly cuponAplicado = computed(() => !!this.servicioCarrito.descuentoCupon());
  /** El descuento aplicado es el de socio (por ser mayor que el del cupón). */
  protected readonly ganaDescuentoSocio = computed(() => this.servicioCarrito.descuento()?.tipo === 'socio');

  protected aplicarCupon(): void {
    const codigo = this.codigoCuponEscrito().trim().toUpperCase();
    if (!codigo) return;
    const resultado = this.servicioCupones.validar(codigo, {
      subtotal: this.servicioCarrito.subtotal(),
      email: this.autenticacion.usuario()?.email,
    });
    this.errorCupon.set(resultado.valido ? null : resultado.motivo!);
    this.servicioCarrito.codigoCupon.set(resultado.valido ? codigo : null);
  }

  protected quitarCupon(): void {
    this.servicioCarrito.codigoCupon.set(null);
    this.codigoCuponEscrito.set('');
  }

  protected validarSocio(): void {
    const dniValido = this.servicioCarrito.validarSocio(this.dniEscrito());
    this.errorDni.set(dniValido ? null : 'El DNI no es válido. Revisa los 8 números y la letra.');
  }

  protected confirmarPedido(): void {
    this.enviando.set(true);
    this.servicioPedidos.confirmar().subscribe({
      next: () => this.enrutador.navigateByUrl('/mis-pedidos'),
      error: () => this.enviando.set(false),
    });
  }
}
