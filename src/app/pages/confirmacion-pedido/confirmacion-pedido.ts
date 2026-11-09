import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { AuthService } from '../../services/auth.service';
import { CarritoService } from '../../services/carrito.service';
import { CuponService } from '../../services/cupon.service';
import { PedidoService } from '../../services/pedido.service';
import { EuroPipe } from '../../utils/euro.pipe';
import { formatDescuento } from '../../utils/formato';

@Component({
  selector: 'app-confirmacion-pedido-page',
  imports: [PageHeader, Alert, Icon, StatusBadge, EuroPipe, RouterLink],
  templateUrl: './confirmacion-pedido.html',
  styleUrl: './confirmacion-pedido.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacionPedidoPage {
  protected readonly carrito = inject(CarritoService);
  private readonly cupones = inject(CuponService);
  private readonly pedidos = inject(PedidoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly formatDescuento = formatDescuento;

  protected readonly codigo = signal(this.carrito.codigoCupon() ?? '');
  protected readonly errorCupon = signal<string | null>(null);
  protected readonly dni = signal(this.carrito.dniSocio() ?? this.auth.usuario()?.dniSocio ?? '');
  protected readonly errorDni = signal<string | null>(null);
  protected readonly enviando = signal(false);

  protected readonly cuponAplicado = computed(() => !!this.carrito.descuentoCupon());
  protected readonly ganaSocio = computed(() => this.carrito.descuento()?.tipo === 'socio');

  protected aplicarCupon(): void {
    const codigo = this.codigo().trim().toUpperCase();
    if (!codigo) return;
    const r = this.cupones.validar(codigo, { subtotal: this.carrito.subtotal(), email: this.auth.usuario()?.email });
    this.errorCupon.set(r.valido ? null : r.motivo!);
    this.carrito.codigoCupon.set(r.valido ? codigo : null);
  }

  protected quitarCupon(): void {
    this.carrito.codigoCupon.set(null);
    this.codigo.set('');
  }

  protected validarSocio(): void {
    const ok = this.carrito.validarSocio(this.dni());
    this.errorDni.set(ok ? null : 'El DNI no es válido. Revisa los 8 números y la letra.');
  }

  protected confirmar(): void {
    this.enviando.set(true);
    this.pedidos.confirmar().subscribe({
      next: () => this.router.navigateByUrl('/mis-pedidos'),
      error: () => this.enviando.set(false),
    });
  }
}
